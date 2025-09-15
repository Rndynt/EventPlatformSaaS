import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Enable CORS for all origins
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
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
    // Import dependencies here to avoid cold start issues
    const { db } = await import('../../lib/drizzle.server');
    const { tickets, transactions, ticketTypes, events, attendees } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');
    const { generateQRCode } = await import('../../lib/qr');
    const { sendEmail, generateTicketEmail } = await import('../../lib/mail');

    // Create table for tracking processed stripe events (idempotency)
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS processed_stripe_events (
          stripe_event_id VARCHAR PRIMARY KEY,
          processed_at TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch (error) {
      // Table might already exist, continue
    }

    const signature = event.headers['stripe-signature'];
    let body = event.body;

    if (!body || !signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing signature or body' }),
      };
    }

    // Handle base64 encoded body for proper signature verification
    if (event.isBase64Encoded) {
      body = Buffer.from(body, 'base64').toString();
    }

    // Verify webhook signature and construct event
    let stripeEvent;
    try {
      const stripe = (await import('stripe')).default;
      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });
      
      stripeEvent = stripeInstance.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Handle payment intent succeeded
    if (stripeEvent.type === 'payment_intent.succeeded') {
      const paymentIntent = stripeEvent.data.object as any;
      const ticketId = paymentIntent.metadata.ticketId;
      const stripeEventId = stripeEvent.id;

      if (!ticketId) {
        console.error('No ticket ID in payment intent metadata');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No ticket ID found' }),
        };
      }

      // Check if this stripe event was already processed (idempotency)
      try {
        const existing = await db.execute(`
          SELECT stripe_event_id FROM processed_stripe_events 
          WHERE stripe_event_id = '${stripeEventId}'
        `);
        
        if (existing.rows.length > 0) {
          console.log('Stripe event already processed:', stripeEventId);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ received: true, already_processed: true }),
          };
        }
      } catch (error) {
        console.error('Error checking processed events:', error);
      }

      // Find the ticket and update status
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, ticketId))
        .limit(1);

      if (!ticket) {
        console.error('Ticket not found:', ticketId);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Ticket not found' }),
        };
      }

      // Generate QR code
      const qrCodeData = await generateQRCode(ticket.token);

      // Update ticket status and QR code
      await db
        .update(tickets)
        .set({ 
          status: 'issued',
          qrCode: qrCodeData 
        })
        .where(eq(tickets.id, ticketId));

      // Update transaction status
      await db
        .update(transactions)
        .set({ status: 'completed' })
        .where(eq(transactions.ticketId, ticketId));

      // Update ticket sold count
      const [ticketType] = await db
        .select()
        .from(ticketTypes)
        .where(eq(ticketTypes.id, ticket.ticketTypeId))
        .limit(1);

      if (ticketType) {
        await db
          .update(ticketTypes)
          .set({ 
            quantitySold: (ticketType.quantitySold || 0) + 1 
          })
          .where(eq(ticketTypes.id, ticket.ticketTypeId));
      }

      // Get event and attendee info properly with joins
      const [ticketData] = await db
        .select({
          ticket: tickets,
          event: events,
          attendee: attendees,
        })
        .from(tickets)
        .innerJoin(events, eq(tickets.eventId, events.id))
        .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
        .where(eq(tickets.id, ticketId))
        .limit(1);

      if (ticketData) {
        try {
          // Send ticket email with proper data
          const emailContent = generateTicketEmail(
            ticketData.attendee.name,
            ticketData.event.title,
            new Date(ticketData.event.startDate).toLocaleDateString(),
            qrCodeData,
            ticketData.ticket.token
          );

          await sendEmail({
            to: ticketData.attendee.email,
            subject: `Your ticket for ${ticketData.event.title}`,
            html: emailContent,
          });
          
          console.log('Payment completed and ticket email sent for:', ticketId);
        } catch (emailError) {
          console.error('Failed to send ticket email after payment:', emailError);
        }
      }
      
      // Mark this stripe event as processed (idempotency)
      try {
        await db.execute(`
          INSERT INTO processed_stripe_events (stripe_event_id) 
          VALUES ('${stripeEventId}')
          ON CONFLICT (stripe_event_id) DO NOTHING
        `);
      } catch (error) {
        console.error('Error recording processed event:', error);
      }
      
      console.log('Payment completed for ticket:', ticketId);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};