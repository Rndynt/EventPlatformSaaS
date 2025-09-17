import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import cookieParser from 'cookie-parser';
// Using HTTP-only cookies and proper headers for CSRF protection instead of deprecated csurf
import { z } from 'zod';
import { db } from '../lib/db';
import { adminUsers, tenants, events, ticketTypes, attendees, tickets, transactions } from '../shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from '../lib/auth';
import { generateTicketToken, generateQRCode, validateTicketToken } from '../lib/qr';
import { sendEmail, generateTicketEmail, generateReminderEmail } from '../lib/mail';
import { sendSMS, generateReminderSMS } from '../lib/sms';
import { createPaymentIntent } from '../lib/stripe';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().min(1, 'Tenant slug is required'),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  tenantSlug: z.string(),
  role: z.enum(['admin', 'manager', 'staff']).default('admin'),
});

const ticketRegisterSchema = z.object({
  tenantSlug: z.string(),
  eventSlug: z.string(),
  ticketTypeId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  ref: z.string().optional(),
});

const analyticsSchema = z.object({
  eventId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  action: z.enum(['visit', 'register', 'purchase', 'checkin']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const checkinSchema = z.object({
  token: z.string(),
  gateId: z.string().optional(),
  operatorId: z.string().optional(),
  notes: z.string().optional(),
});

const paymentIntentSchema = z.object({
  ticketId: z.string().uuid(),
});

const reminderSchema = z.object({
  eventId: z.string().uuid(),
  when: z.enum(['24h', '1h', 'custom']),
  customMessage: z.string().optional(),
});

// Helper functions
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending': return 'Payment is pending for this ticket';
    case 'cancelled': return 'This ticket has been cancelled';
    case 'used': return 'This ticket has already been used';
    default: return 'Ticket status is invalid';
  }
}

function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

function extractToken(req: Request): string | null {
  // Try cookie first
  const cookieToken = req.cookies['auth-token'];
  if (cookieToken) {
    return cookieToken;
  }
  // Fall back to Authorization header
  return extractTokenFromHeader(req);
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: any) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'No authentication token' });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = {
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
    email: payload.email,
  };
  
  next();
}

// Enhanced auth middleware that also validates tenant isolation
function requireAuthWithTenant(req: AuthenticatedRequest, res: Response, next: any) {
  requireAuth(req, res, async (err: any) => {
    if (err) return next(err);
    
    try {
      // Verify user is still active and belongs to the correct tenant
      const [user] = await db
        .select()
        .from(adminUsers)
        .where(and(
          eq(adminUsers.id, req.user!.userId),
          eq(adminUsers.tenantId, req.user!.tenantId),
          eq(adminUsers.isActive, true)
        ))
        .limit(1);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }
      
      next();
    } catch (error) {
      console.error('Tenant validation error:', error);
      return res.status(500).json({ error: 'Authentication validation failed' });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AUTH ROUTES
  // POST /api/v1/auth - Login
  app.post("/api/v1/auth", async (req: Request, res: Response) => {
    try {
      const { email, password, tenantSlug } = loginSchema.parse(req.body);

      // Find admin user (tenantSlug is now required)
      const adminQuery = db
        .select()
        .from(adminUsers)
        .innerJoin(tenants, eq(adminUsers.tenantId, tenants.id))
        .where(and(
          eq(adminUsers.email, email),
          eq(tenants.slug, tenantSlug),
          eq(adminUsers.isActive, true)
        ));

      const [adminData] = await adminQuery.limit(1);

      if (!adminData || !adminData.admin_users.isActive) {
        return res.status(401).json({ error: 'Invalid credentials or account inactive' });
      }

      // Verify password
      const isValid = await verifyPassword(password, adminData.admin_users.password);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, adminData.admin_users.id));

      // Generate JWT
      const token = generateJWT({
        userId: adminData.admin_users.id,
        tenantId: adminData.admin_users.tenantId,
        role: adminData.admin_users.role as string,
        email: adminData.admin_users.email,
      });

      // Set HTTP-only cookie
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/',
      });

      res.json({
        success: true,
        user: {
          id: adminData.admin_users.id,
          email: adminData.admin_users.email,
          name: adminData.admin_users.name,
          role: adminData.admin_users.role,
          tenant: {
            id: adminData.tenants.id,
            slug: adminData.tenants.slug,
            name: adminData.tenants.name,
          },
        },
        // JWT token is set in HTTP-only cookie for security
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/v1/auth - Register new admin user (restricted)
  app.put("/api/v1/auth", async (req: Request, res: Response) => {
    try {
      const { email, password, name, tenantSlug, role } = registerSchema.parse(req.body);

      // Find tenant
      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, tenantSlug))
        .limit(1);

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(adminUsers)
        .where(and(
          eq(adminUsers.email, email),
          eq(adminUsers.tenantId, tenant.id)
        ))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({ error: 'User already exists for this tenant' });
      }

      // Check if this tenant already has admin users
      const [existingAdminCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(adminUsers)
        .where(eq(adminUsers.tenantId, tenant.id))
        .limit(1);

      const hasExistingAdmins = existingAdminCount && Number(existingAdminCount.count) > 0;

      // If tenant has existing admins, require authentication
      if (hasExistingAdmins) {
        const token = extractToken(req);
        
        if (!token) {
          return res.status(401).json({ error: 'Authentication required to create additional admin users' });
        }

        const payload = verifyJWT(token);
        if (!payload) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Verify requesting user belongs to same tenant
        if (payload.tenantId !== tenant.id) {
          return res.status(403).json({ error: 'Cannot create admin users for different tenant' });
        }

        // Verify requesting user has admin role
        if (payload.role !== 'admin') {
          return res.status(403).json({ error: 'Only admin users can create new admin accounts' });
        }

        // Verify requesting user is active
        const [requestingUser] = await db
          .select()
          .from(adminUsers)
          .where(and(
            eq(adminUsers.id, payload.userId),
            eq(adminUsers.isActive, true)
          ))
          .limit(1);

        if (!requestingUser) {
          return res.status(401).json({ error: 'Requesting user not found or inactive' });
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create admin user
      const [newUser] = await db
        .insert(adminUsers)
        .values({
          tenantId: tenant.id,
          email,
          password: hashedPassword,
          name,
          role,
        })
        .returning();

      // Generate JWT
      const token = generateJWT({
        userId: newUser.id,
        tenantId: newUser.tenantId,
        role: newUser.role as string,
        email: newUser.email,
      });

      // Set HTTP-only cookie
      res.cookie('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/',
      });

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          tenant: {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
          },
        },
        // JWT token is set in HTTP-only cookie for security
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/v1/auth - Verify current user
  app.get("/api/v1/auth", async (req: Request, res: Response) => {
    try {
      // Try to get token from cookie first, then Authorization header
      const token = extractToken(req);
      
      if (!token) {
        return res.status(401).json({ error: 'No authentication token' });
      }

      // Verify JWT
      const payload = verifyJWT(token);
      
      if (!payload) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Get current user data
      const [adminData] = await db
        .select()
        .from(adminUsers)
        .innerJoin(tenants, eq(adminUsers.tenantId, tenants.id))
        .where(
          and(
            eq(adminUsers.id, payload.userId),
            eq(adminUsers.isActive, true)
          )
        )
        .limit(1);

      if (!adminData) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      res.json({
        success: true,
        user: {
          id: adminData.admin_users.id,
          email: adminData.admin_users.email,
          name: adminData.admin_users.name,
          role: adminData.admin_users.role,
          tenant: {
            id: adminData.tenants.id,
            slug: adminData.tenants.slug,
            name: adminData.tenants.name,
          },
        },
      });
    } catch (error) {
      console.error('Auth verification error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  });

  // DELETE /api/v1/auth - Logout
  app.delete("/api/v1/auth", (req: Request, res: Response) => {
    try {
      // Clear the HTTP-only cookie with same options as when set
      res.clearCookie('auth-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // REGISTER ROUTES
  // POST /api/v1/register - Register for event
  app.post("/api/v1/register", async (req: Request, res: Response) => {
    try {
      const validatedData = ticketRegisterSchema.parse(req.body);

      // Find the event and ticket type
      const [event] = await db
        .select()
        .from(events)
        .innerJoin(ticketTypes, eq(events.id, ticketTypes.eventId))
        .where(
          and(
            eq(events.slug, validatedData.eventSlug),
            eq(ticketTypes.id, validatedData.ticketTypeId)
          )
        )
        .limit(1);

      if (!event) {
        return res.status(404).json({ error: 'Event or ticket type not found' });
      }

      // Check capacity
      if (event.ticket_types.quantity && (event.ticket_types.quantitySold ?? 0) >= event.ticket_types.quantity) {
        return res.status(400).json({ error: 'Ticket type is sold out' });
      }

      // Create or find attendee
      let [attendee] = await db
        .select()
        .from(attendees)
        .where(eq(attendees.email, validatedData.email))
        .limit(1);

      if (!attendee) {
        [attendee] = await db
          .insert(attendees)
          .values({
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            company: validatedData.company,
          })
          .returning();
      }

      // Generate ticket token
      const ticketToken = generateTicketToken();

      // Create ticket record
      const [ticket] = await db
        .insert(tickets)
        .values({
          token: ticketToken,
          eventId: event.events.id,
          ticketTypeId: validatedData.ticketTypeId,
          attendeeId: attendee.id,
          status: event.ticket_types.isPaid ? 'pending' : 'issued',
        })
        .returning();

      if (event.ticket_types.isPaid) {
        // Create payment intent for paid tickets
        const amount = Math.round(parseFloat(event.ticket_types.price ?? '0') * 100); // Convert to cents
        
        try {
          const clientSecret = await createPaymentIntent({
            amount,
            currency: (event.ticket_types.currency ?? 'usd').toLowerCase(),
            metadata: {
              ticketId: ticket.id,
              eventId: event.events.id,
              attendeeId: attendee.id,
            },
          });

          // Create transaction record
          await db.insert(transactions).values({
            ticketId: ticket.id,
            amount: event.ticket_types.price ?? '0',
            currency: event.ticket_types.currency ?? 'USD',
            status: 'pending',
            stripePaymentIntentId: clientSecret.startsWith('pi_') ? clientSecret : undefined,
          });

          return res.json({
            success: true,
            ticketId: ticket.id,
            clientSecret,
            requiresPayment: true,
            amount: parseFloat(event.ticket_types.price ?? '0'),
            currency: event.ticket_types.currency ?? 'USD',
          });
        } catch (paymentError) {
          console.error('Payment intent creation failed:', paymentError);
          
          // Clean up ticket if payment setup fails
          await db.delete(tickets).where(eq(tickets.id, ticket.id));
          
          return res.status(500).json({ error: 'Failed to setup payment' });
        }
      } else {
        // Free ticket - generate QR code and send email immediately
        const qrCodeData = await generateQRCode(ticketToken);
        
        // Update ticket with QR code
        await db
          .update(tickets)
          .set({ qrCode: qrCodeData })
          .where(eq(tickets.id, ticket.id));

        // Update ticket type quantity
        await db
          .update(ticketTypes)
          .set({ quantitySold: (event.ticket_types.quantitySold ?? 0) + 1 })
          .where(eq(ticketTypes.id, validatedData.ticketTypeId));

        // Send ticket email
        const eventDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        }).format(new Date(event.events.startDate));

        const emailHTML = generateTicketEmail(
          attendee.name,
          event.events.title,
          eventDate,
          qrCodeData,
          ticketToken
        );

        await sendEmail({
          to: attendee.email,
          subject: `Your ticket for ${event.events.title}`,
          html: emailHTML,
        });

        return res.json({
          success: true,
          ticketId: ticket.id,
          requiresPayment: false,
          message: 'Registration successful! Check your email for your ticket.',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ANALYTICS ROUTES
  // POST /api/v1/analytics - Get analytics data (protected)
  app.post("/api/v1/analytics", requireAuthWithTenant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId, tenantId, action, startDate, endDate } = analyticsSchema.parse(req.body);

      if (eventId) {
        // Get event-specific analytics with tenant scoping
        const [event] = await db
          .select()
          .from(events)
          .where(and(
            eq(events.id, eventId),
            eq(events.tenantId, req.user!.tenantId)
          ))
          .limit(1);

        if (!event) {
          return res.status(404).json({ error: 'Event not found or access denied' });
        }

        // Get ticket statistics
        const ticketStats = await db
          .select({
            total: sql<number>`count(*)`,
            issued: sql<number>`count(case when status = 'issued' then 1 end)`,
            pending: sql<number>`count(case when status = 'pending' then 1 end)`,
            checkedIn: sql<number>`count(case when checked_in_at is not null then 1 end)`,
          })
          .from(tickets)
          .where(eq(tickets.eventId, eventId))
          .groupBy()
          .then(rows => rows[0] || { total: 0, issued: 0, pending: 0, checkedIn: 0 });

        // Get revenue statistics
        const revenueStats = await db
          .select({
            totalRevenue: sql<number>`coalesce(sum(amount), 0)`,
            completedRevenue: sql<number>`coalesce(sum(case when status = 'completed' then amount else 0 end), 0)`,
            pendingRevenue: sql<number>`coalesce(sum(case when status = 'pending' then amount else 0 end), 0)`,
          })
          .from(transactions)
          .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
          .where(eq(tickets.eventId, eventId))
          .groupBy()
          .then(rows => rows[0] || { totalRevenue: 0, completedRevenue: 0, pendingRevenue: 0 });

        return res.json({
          success: true,
          event: {
            id: event.id,
            title: event.title,
            type: event.type,
            startDate: event.startDate,
            capacity: event.capacity,
          },
          tickets: {
            total: Number(ticketStats.total),
            issued: Number(ticketStats.issued),
            pending: Number(ticketStats.pending),
            checkedIn: Number(ticketStats.checkedIn),
            conversionRate: ticketStats.total > 0 ? (Number(ticketStats.issued) / Number(ticketStats.total)) * 100 : 0,
            checkinRate: ticketStats.issued > 0 ? (Number(ticketStats.checkedIn) / Number(ticketStats.issued)) * 100 : 0,
          },
          revenue: {
            total: Number(revenueStats.totalRevenue),
            completed: Number(revenueStats.completedRevenue),
            pending: Number(revenueStats.pendingRevenue),
          },
        });
      }

      // If no specific event, return basic response
      res.json({
        success: true,
        message: 'Analytics endpoint - implement tenant-wide analytics as needed',
      });
    } catch (error) {
      console.error('Analytics error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // CHECKIN ROUTES  
  // POST /api/v1/checkin - Check in attendee
  app.post("/api/v1/checkin", async (req: Request, res: Response) => {
    try {
      const { token, gateId, operatorId, notes } = checkinSchema.parse(req.body);

      // Validate token format
      if (!validateTicketToken(token)) {
        return res.status(400).json({ error: 'Invalid ticket token format' });
      }

      // Find ticket with all related data
      const [ticketData] = await db
        .select()
        .from(tickets)
        .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
        .innerJoin(events, eq(tickets.eventId, events.id))
        .where(eq(tickets.token, token))
        .limit(1);

      if (!ticketData) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Check if ticket is valid for check-in
      if (ticketData.tickets.status !== 'issued') {
        return res.status(400).json({ 
          error: 'Ticket is not issued or is invalid',
          status: ticketData.tickets.status,
          details: getStatusMessage(ticketData.tickets.status ?? 'pending')
        });
      }

      // Check if already checked in
      if (ticketData.tickets.checkedInAt) {
        return res.status(400).json({ 
          error: 'Ticket already checked in',
          checkedInAt: ticketData.tickets.checkedInAt,
          attendee: {
            name: ticketData.attendees.name,
            email: ticketData.attendees.email,
          }
        });
      }

      // Check if event has started (optional validation)
      const now = new Date();
      const eventStart = new Date(ticketData.events.startDate);
      const eventEnd = new Date(ticketData.events.endDate);

      // Allow check-in 2 hours before event start
      const checkinStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);

      if (now < checkinStart) {
        return res.status(400).json({ 
          error: 'Check-in not yet available',
          message: `Check-in opens 2 hours before the event starts`,
          eventStart: eventStart.toISOString()
        });
      }

      if (now > eventEnd) {
        return res.status(400).json({ 
          error: 'Event has ended',
          message: 'Check-in is no longer available as the event has ended',
          eventEnd: eventEnd.toISOString()
        });
      }

      // Perform check-in
      const checkinTime = new Date();
      
      const [updatedTicket] = await db
        .update(tickets)
        .set({ 
          checkedInAt: checkinTime,
          metadata: ticketData.tickets.metadata ? {
            ...ticketData.tickets.metadata,
            checkinGateId: gateId,
            checkinOperatorId: operatorId,
            checkinNotes: notes,
          } : {
            checkinGateId: gateId,
            checkinOperatorId: operatorId,
            checkinNotes: notes,
          }
        })
        .where(eq(tickets.id, ticketData.tickets.id))
        .returning();

      res.json({
        success: true,
        message: 'Check-in successful',
        checkedInAt: checkinTime,
        attendee: {
          name: ticketData.attendees.name,
          email: ticketData.attendees.email,
          company: ticketData.attendees.company,
        },
        event: {
          title: ticketData.events.title,
          type: ticketData.events.type,
        }
      });
    } catch (error) {
      console.error('Check-in error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PAYMENT INTENT ROUTES
  // POST /api/v1/payment-intent - Create payment intent
  app.post("/api/v1/payment-intent", async (req: Request, res: Response) => {
    try {
      const { ticketId } = paymentIntentSchema.parse(req.body);

      // Find the ticket and verify it's in pending status
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      if (ticket.status !== 'pending') {
        return res.status(400).json({ error: 'Ticket is not in pending status' });
      }

      // Find existing transaction
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.ticketId, ticketId))
        .limit(1);

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Create or retrieve payment intent
      const amount = Math.round(parseFloat(transaction.amount) * 100); // Convert to cents
      
      let clientSecret = transaction.stripePaymentIntentId;
      
      if (!clientSecret) {
        clientSecret = await createPaymentIntent({
          amount,
          currency: (transaction.currency ?? 'usd').toLowerCase(),
          metadata: {
            ticketId: ticket.id,
            transactionId: transaction.id,
          },
        });

        // Update transaction with payment intent ID
        await db
          .update(transactions)
          .set({ stripePaymentIntentId: clientSecret })
          .where(eq(transactions.id, transaction.id));
      }

      res.json({
        success: true,
        clientSecret,
        amount,
        currency: transaction.currency,
      });
    } catch (error) {
      console.error('Payment intent error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // SEND REMINDER ROUTES
  // POST /api/v1/send-reminder - Send reminder to attendees (protected)
  app.post("/api/v1/send-reminder", requireAuthWithTenant, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { eventId, when, customMessage } = reminderSchema.parse(req.body);

      // Find event with tenant scoping
      const [event] = await db
        .select()
        .from(events)
        .where(and(
          eq(events.id, eventId),
          eq(events.tenantId, req.user!.tenantId)
        ))
        .limit(1);

      if (!event) {
        return res.status(404).json({ error: 'Event not found or access denied' });
      }

      // Get all issued tickets for this event
      const eventTickets = await db
        .select()
        .from(tickets)
        .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
        .where(
          and(
            eq(tickets.eventId, eventId),
            eq(tickets.status, 'issued')
          )
        );

      if (eventTickets.length === 0) {
        return res.json({
          success: true,
          message: 'No issued tickets found for this event',
          remindersSent: 0
        });
      }

      let emailCount = 0;
      let smsCount = 0;
      const errors: string[] = [];

      // Format event date
      const eventDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(new Date(event.startDate));

      // Event link (this would be the actual event page URL)
      const eventLink = `${process.env.BASE_URL || 'http://localhost:5000'}/events/${event.slug}`;

      // Send reminders to all attendees
      for (const ticketData of eventTickets) {
        const attendee = ticketData.attendees;

        try {
          // Send email reminder
          let emailSubject = '';
          let emailContent = '';

          if (customMessage) {
            emailSubject = `Event Reminder: ${event.title}`;
            emailContent = `
              <p>Hi ${attendee.name},</p>
              <p>${customMessage}</p>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><a href="${eventLink}">View Event Details</a></p>
            `;
          } else {
            const timeText = when === '24h' ? '24 hours' : when === '1h' ? '1 hour' : '';
            emailSubject = `Reminder: ${event.title} ${timeText ? `in ${timeText}` : ''}`;
            emailContent = generateReminderEmail(
              attendee.name,
              event.title,
              eventDate,
              eventLink
            );
          }

          const emailSent = await sendEmail({
            to: attendee.email,
            subject: emailSubject,
            html: emailContent,
          });

          if (emailSent) {
            emailCount++;
          } else {
            errors.push(`Failed to send email to ${attendee.email}`);
          }

          // Send SMS reminder if phone number is available
          if (attendee.phone) {
            const smsMessage = customMessage || generateReminderSMS(
              attendee.name,
              event.title,
              eventDate
            );

            const smsSent = await sendSMS({
              to: attendee.phone,
              message: smsMessage,
            });

            if (smsSent) {
              smsCount++;
            } else {
              errors.push(`Failed to send SMS to ${attendee.phone}`);
            }
          }
        } catch (error) {
          console.error(`Failed to send reminder to ${attendee.email}:`, error);
          errors.push(`Failed to send reminder to ${attendee.email}`);
        }
      }

      res.json({
        success: true,
        remindersSent: {
          emails: emailCount,
          sms: smsCount,
          total: emailCount + smsCount,
        },
        totalAttendees: eventTickets.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error('Send reminder error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // TICKET ROUTES
  // GET /api/v1/ticket/:token - Get ticket details
  app.get("/api/v1/ticket/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      // Validate token format
      if (!validateTicketToken(token)) {
        return res.status(400).json({ error: 'Invalid ticket token format' });
      }

      // Find ticket with all related data
      const [ticketData] = await db
        .select()
        .from(tickets)
        .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
        .innerJoin(events, eq(tickets.eventId, events.id))
        .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(eq(tickets.token, token))
        .limit(1);

      if (!ticketData) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Check if ticket is valid for check-in
      if (ticketData.tickets.status !== 'issued') {
        return res.status(400).json({ 
          error: 'Invalid ticket status',
          status: ticketData.tickets.status
        });
      }

      // Return ticket information for check-in
      res.json({
        success: true,
        ticket: {
          id: ticketData.tickets.id,
          token: ticketData.tickets.token,
          status: ticketData.tickets.status,
          checkedInAt: ticketData.tickets.checkedInAt,
          qrCode: ticketData.tickets.qrCode,
        },
        attendee: {
          name: ticketData.attendees.name,
          email: ticketData.attendees.email,
          phone: ticketData.attendees.phone,
          company: ticketData.attendees.company,
        },
        event: {
          title: ticketData.events.title,
          type: ticketData.events.type,
          startDate: ticketData.events.startDate,
          endDate: ticketData.events.endDate,
          location: ticketData.events.location,
        },
        ticketType: {
          name: ticketData.ticket_types.name,
          description: ticketData.ticket_types.description,
          perks: ticketData.ticket_types.perks,
        }
      });
    } catch (error) {
      console.error('Ticket validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // WEBHOOK ROUTES
  // POST /api/v1/webhook - Stripe webhook
  app.post("/api/v1/webhook", async (req: Request, res: Response) => {
    if (!stripe || !webhookSecret) {
      console.log('🔧 DEV MODE: Simulating webhook success');
      return res.json({ received: true });
    }

    try {
      const body = req.body;
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        return res.status(400).json({ error: 'Missing Stripe signature' });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).json({ error: 'Invalid signature' });
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Find transaction by payment intent ID
          const [transaction] = await db
            .select()
            .from(transactions)
            .where(eq(transactions.stripePaymentIntentId, paymentIntent.id))
            .limit(1);

          if (!transaction) {
            console.error('Transaction not found for payment intent:', paymentIntent.id);
            return res.status(404).json({ error: 'Transaction not found' });
          }

          // Update transaction status
          await db
            .update(transactions)
            .set({ status: 'completed' })
            .where(eq(transactions.id, transaction.id));

          // Get ticket and related data
          const [ticketData] = await db
            .select()
            .from(tickets)
            .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
            .innerJoin(events, eq(tickets.eventId, events.id))
            .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
            .where(eq(tickets.id, transaction.ticketId))
            .limit(1);

          if (!ticketData) {
            console.error('Ticket data not found for transaction:', transaction.id);
            return res.status(404).json({ error: 'Ticket not found' });
          }

          // Generate QR code
          const qrCodeData = await generateQRCode(ticketData.tickets.token);

          // Update ticket status and QR code
          await db
            .update(tickets)
            .set({ 
              status: 'issued',
              qrCode: qrCodeData 
            })
            .where(eq(tickets.id, ticketData.tickets.id));

          // Update ticket type quantity
          await db
            .update(ticketTypes)
            .set({ quantitySold: (ticketData.ticket_types.quantitySold ?? 0) + 1 })
            .where(eq(ticketTypes.id, ticketData.tickets.ticketTypeId));

          // Send ticket email
          const eventDate = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          }).format(new Date(ticketData.events.startDate));

          const emailHTML = generateTicketEmail(
            ticketData.attendees.name,
            ticketData.events.title,
            eventDate,
            qrCodeData,
            ticketData.tickets.token
          );

          await sendEmail({
            to: ticketData.attendees.email,
            subject: `Your ticket for ${ticketData.events.title}`,
            html: emailHTML,
          });

          console.log('Payment successful and ticket issued:', ticketData.tickets.id);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          // Find transaction and update status
          const [transaction] = await db
            .select()
            .from(transactions)
            .where(eq(transactions.stripePaymentIntentId, paymentIntent.id))
            .limit(1);

          if (transaction) {
            await db
              .update(transactions)
              .set({ status: 'failed' })
              .where(eq(transactions.id, transaction.id));

            console.log('Payment failed for transaction:', transaction.id);
          }
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
