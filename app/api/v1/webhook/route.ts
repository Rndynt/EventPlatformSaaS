import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/drizzle.server';
import { tickets, transactions, ticketTypes, attendees, events } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateQRCode } from '@/lib/qr';
import { sendEmail, generateTicketEmail } from '@/lib/mail';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.log('🔧 DEV MODE: Simulating webhook success');
    return NextResponse.json({ received: true });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
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
          return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
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
          return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
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

        // Update ticket sold count
        await db
          .update(ticketTypes)
          .set({ 
            quantitySold: (ticketData.ticket_types.quantitySold || 0) + 1 
          })
          .where(eq(ticketTypes.id, ticketData.tickets.ticketTypeId));

        // Send ticket email
        const emailContent = generateTicketEmail(
          ticketData.attendees.name,
          ticketData.events.title,
          new Date(ticketData.events.startDate).toLocaleDateString(),
          qrCodeData,
          ticketData.tickets.token
        );

        await sendEmail({
          to: ticketData.attendees.email,
          subject: `Your ticket for ${ticketData.events.title}`,
          html: emailContent,
        });

        console.log('✅ Payment processed successfully for ticket:', ticketData.tickets.token);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find and update transaction
        await db
          .update(transactions)
          .set({ status: 'failed' })
          .where(eq(transactions.stripePaymentIntentId, paymentIntent.id));

        console.log('❌ Payment failed for payment intent:', paymentIntent.id);
        break;
      }

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
