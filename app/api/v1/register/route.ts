import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { tenants, events, ticketTypes, attendees, tickets, transactions } from '@/shared/schema';
import { eq, and, sql, ne } from 'drizzle-orm';
import { generateTicketToken, generateQRCode } from '@/lib/qr';
import { sendEmail, generateTicketEmail } from '@/lib/mail';
import { createPaymentIntent } from '@/lib/stripe';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, eventSlug, ticketTypeId, name, email, phone, company, ref } = registerSchema.parse(body);

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Find event
    const [event] = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.tenantId, tenant.id),
          eq(events.slug, eventSlug)
        )
      )
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Find ticket type
    const [ticketType] = await db
      .select()
      .from(ticketTypes)
      .where(
        and(
          eq(ticketTypes.id, ticketTypeId),
          eq(ticketTypes.eventId, event.id),
          eq(ticketTypes.isVisible, true)
        )
      )
      .limit(1);

    if (!ticketType) {
      return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });
    }

    // Check if there are available tickets
    const [currentTickets] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(tickets)
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .where(
        and(
          eq(attendees.eventId, event.id),
          eq(tickets.ticketTypeId, ticketType.id),
          ne(tickets.status, 'cancelled')
        )
      );

    if (currentTickets.count >= ticketType.quantity) {
      return NextResponse.json({ error: 'Ticket type is sold out' }, { status: 400 });
    }

    // Create attendee
    const [attendee] = await db
      .insert(attendees)
      .values({
        eventId: event.id,
        name,
        email,
        phone: phone || null,
        company: company || null,
        referenceSource: ref || null,
      })
      .returning();

    // Generate ticket token and QR code
    const token = generateTicketToken();
    const qrCodeUrl = await generateQRCode(token);

    // Create ticket
    const [ticket] = await db
      .insert(tickets)
      .values({
        attendeeId: attendee.id,
        ticketTypeId: ticketType.id,
        token,
        qrCodeUrl,
        status: ticketType.isPaid ? 'pending' : 'active',
      })
      .returning();

    let clientSecret = null;
    let transaction = null;

    // If it's a paid ticket, create payment intent
    if (ticketType.isPaid) {
      try {
        const paymentIntent = await createPaymentIntent(
          parseFloat(ticketType.price) * 100, // Convert to cents
          'usd',
          {
            ticketId: ticket.id,
            eventTitle: event.title,
            attendeeName: name,
            attendeeEmail: email,
          }
        );

        clientSecret = paymentIntent.client_secret;

        // Create transaction record
        [transaction] = await db
          .insert(transactions)
          .values({
            ticketId: ticket.id,
            amount: ticketType.price,
            currency: 'usd',
            status: 'pending',
            paymentIntentId: paymentIntent.id,
            metadata: {
              eventTitle: event.title,
              ticketType: ticketType.name,
              attendeeName: name,
            },
          })
          .returning();
      } catch (stripeError) {
        console.error('Stripe payment intent creation failed:', stripeError);
        return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
      }
    } else {
      // For free tickets, send confirmation email immediately
      try {
        const emailHtml = generateTicketEmail({
          attendeeName: name,
          eventTitle: event.title,
          eventDate: event.startDate,
          eventLocation: event.location || 'Virtual Event',
          ticketType: ticketType.name,
          qrCodeUrl,
          ticketToken: token,
        });

        await sendEmail({
          to: email,
          subject: `Your ticket for ${event.title}`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the registration if email fails
      }
    }

    const responseData = {
      success: true,
      attendee: {
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
      },
      ticket: {
        id: ticket.id,
        token: ticket.token,
        qrCodeUrl: ticket.qrCodeUrl,
        status: ticket.status,
      },
      ticketType: {
        name: ticketType.name,
        price: ticketType.price,
        isPaid: ticketType.isPaid,
      },
      event: {
        title: event.title,
        startDate: event.startDate,
        location: event.location,
      },
      ...(clientSecret && { clientSecret }),
      ...(transaction && { transactionId: transaction.id }),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}