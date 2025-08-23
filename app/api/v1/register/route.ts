import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { events, ticketTypes, attendees, tickets, transactions } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
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
    const validatedData = registerSchema.parse(body);

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
      return NextResponse.json(
        { error: 'Event or ticket type not found' },
        { status: 404 }
      );
    }

    // Check capacity
    if (event.ticket_types.quantity && event.ticket_types.quantitySold >= event.ticket_types.quantity) {
      return NextResponse.json(
        { error: 'Ticket type is sold out' },
        { status: 400 }
      );
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
      const amount = Math.round(parseFloat(event.ticket_types.price) * 100); // Convert to cents
      
      try {
        const clientSecret = await createPaymentIntent({
          amount,
          currency: event.ticket_types.currency.toLowerCase(),
          metadata: {
            ticketId: ticket.id,
            eventId: event.events.id,
            attendeeId: attendee.id,
          },
        });

        // Create transaction record
        await db.insert(transactions).values({
          ticketId: ticket.id,
          amount: event.ticket_types.price,
          currency: event.ticket_types.currency,
          status: 'pending',
          stripePaymentIntentId: clientSecret.startsWith('pi_') ? clientSecret : undefined,
        });

        return NextResponse.json({
          success: true,
          ticketId: ticket.id,
          clientSecret,
          amount,
          currency: event.ticket_types.currency,
        });
      } catch (error) {
        console.error('Payment intent creation failed:', error);
        return NextResponse.json(
          { error: 'Failed to create payment intent' },
          { status: 500 }
        );
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
          event.events.title,
          new Date(event.events.startDate).toLocaleDateString(),
          qrCodeData,
          ticketToken
        );

        await sendEmail({
          to: attendee.email,
          subject: `Your ticket for ${event.events.title}`,
          html: emailContent,
        });

        // Update ticket sold count
        await db
          .update(ticketTypes)
          .set({ 
            quantitySold: (event.ticket_types.quantitySold || 0) + 1 
          })
          .where(eq(ticketTypes.id, validatedData.ticketTypeId));

        return NextResponse.json({
          success: true,
          ticket: {
            id: ticket.id,
            token: ticketToken,
            qrCode: qrCodeData,
            status: 'issued',
          },
          event: {
            title: event.events.title,
            date: event.events.startDate,
          },
        });
      } catch (error) {
        console.error('Free ticket processing failed:', error);
        return NextResponse.json(
          { error: 'Failed to process free ticket' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
