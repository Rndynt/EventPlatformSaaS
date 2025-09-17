import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';

const registerSchema = z.object({
  tenantSlug: z.string(),
  eventSlug: z.string(),
  ticketTypeId: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  ref: z.string().optional(),
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const validatedData = registerSchema.parse(body);

    // Import database and schema here to avoid cold start issues
    const { db } = await import('../../lib/drizzle.server');
    const { events, ticketTypes, attendees, tickets, transactions, tenants } = await import('../../shared/schema');
    const { eq, and } = await import('drizzle-orm');
    const { generateTicketToken, generateQRCode } = await import('../../lib/qr');
    const { sendEmail, generateTicketEmail } = await import('../../lib/mail');
    const { createPaymentIntent } = await import('../../lib/stripe');

    // Find the tenant first to ensure isolation
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, validatedData.tenantSlug))
      .limit(1);

    if (!tenant) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Tenant not found' }),
      };
    }

    // Find the event and ticket type with tenant isolation
    const [eventResult] = await db
      .select({
        event: events,
        ticketType: ticketTypes
      })
      .from(events)
      .innerJoin(ticketTypes, eq(events.id, ticketTypes.eventId))
      .where(
        and(
          eq(events.slug, validatedData.eventSlug),
          eq(events.tenantId, tenant.id),
          eq(ticketTypes.id, validatedData.ticketTypeId)
        )
      )
      .limit(1);

    if (!eventResult) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Event or ticket type not found' }),
      };
    }

    const { event, ticketType } = eventResult;

    // Check capacity
    if (ticketType.quantity && ticketType.quantitySold >= ticketType.quantity) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ticket type is sold out' }),
      };
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
        eventId: event.id,
        ticketTypeId: validatedData.ticketTypeId,
        attendeeId: attendee.id,
        status: ticketType.isPaid ? 'pending' : 'issued',
      })
      .returning();

    if (ticketType.isPaid) {
      // Create payment intent for paid tickets
      const amount = Math.round(parseFloat(ticketType.price) * 100); // Convert to cents
      
      try {
        const clientSecret = await createPaymentIntent({
          amount,
          currency: ticketType.currency.toLowerCase(),
          metadata: {
            ticketId: ticket.id,
            eventId: event.id,
            attendeeId: attendee.id,
          },
        });

        // Create transaction record
        await db.insert(transactions).values({
          ticketId: ticket.id,
          amount: ticketType.price,
          currency: ticketType.currency,
          status: 'pending',
          stripePaymentIntentId: clientSecret.startsWith('pi_') ? clientSecret : undefined,
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            ticketId: ticket.id,
            clientSecret,
            amount,
            currency: ticketType.currency,
          }),
        };
      } catch (error) {
        console.error('Payment intent creation failed:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to create payment intent' }),
        };
      }
    } else {
      // Free ticket - generate QR code and send email immediately
      try {
        const qrCodeData = await generateQRCode(ticketToken);
        
        // Update ticket with QR code
        await db
          .update(tickets)
          .set({ qrCode: qrCodeData })
          .where(eq(tickets.id, ticket.id));

        // Send ticket email
        const emailContent = generateTicketEmail(
          attendee.name,
          event.title,
          new Date(event.startDate).toLocaleDateString(),
          qrCodeData,
          ticketToken
        );

        await sendEmail({
          to: attendee.email,
          subject: `Your ticket for ${event.title}`,
          html: emailContent,
        });

        // Update ticket sold count
        await db
          .update(ticketTypes)
          .set({ 
            quantitySold: (ticketType.quantitySold || 0) + 1 
          })
          .where(eq(ticketTypes.id, validatedData.ticketTypeId));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            ticket: {
              id: ticket.id,
              token: ticketToken,
              qrCode: qrCodeData,
              status: 'issued',
            },
            event: {
              title: event.title,
              date: event.startDate,
            },
          }),
        };
      } catch (error) {
        console.error('Free ticket processing failed:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to process free ticket' }),
        };
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid input data',
          details: error.errors,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};