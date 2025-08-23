import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { tickets, transactions, attendees, events, ticketTypes } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateQRCode } from '@/lib/qr';
import { sendEmail, generateTicketEmail } from '@/lib/mail';

const simulatePaymentSchema = z.object({
  ticketId: z.string().uuid(),
  simulate: z.enum(['success', 'failure']).default('success'),
  delay: z.number().min(0).max(10000).default(1000), // Delay in ms
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, simulate, delay } = simulatePaymentSchema.parse(body);

    // Add artificial delay to simulate processing time
    await new Promise(resolve => setTimeout(resolve, delay));

    // Find the ticket and related data
    const [ticketData] = await db
      .select()
      .from(tickets)
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticketData) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'simulation',
      ticketId,
      simulate,
      delay,
    };

    if (simulate === 'failure') {
      // Simulate payment failure
      await db
        .update(transactions)
        .set({ status: 'failed' })
        .where(eq(transactions.ticketId, ticketId));

      console.log('💳 DEV SIMULATION: Payment failed', logEntry);

      return NextResponse.json({
        success: false,
        error: 'Simulated payment failure',
        simulation: true,
        details: {
          reason: 'card_declined',
          code: 'insufficient_funds',
          message: 'Your card has insufficient funds.',
        }
      });
    }

    // Simulate successful payment
    try {
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

      // Update transaction status
      await db
        .update(transactions)
        .set({ status: 'completed' })
        .where(eq(transactions.ticketId, ticketData.tickets.id));

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

      console.log('💳 DEV SIMULATION: Payment succeeded', {
        ...logEntry,
        attendee: ticketData.attendees.name,
        event: ticketData.events.title,
        amount: ticketData.ticket_types.price,
      });

      return NextResponse.json({
        success: true,
        simulation: true,
        ticket: {
          id: ticketData.tickets.id,
          token: ticketData.tickets.token,
          status: 'issued',
          qrCode: qrCodeData,
        },
        event: {
          title: ticketData.events.title,
          date: ticketData.events.startDate,
        },
        attendee: {
          name: ticketData.attendees.name,
          email: ticketData.attendees.email,
        },
        payment: {
          amount: parseFloat(ticketData.ticket_types.price),
          currency: ticketData.ticket_types.currency,
          simulatedPaymentIntentId: `pi_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }
      });
    } catch (error) {
      console.error('💳 DEV SIMULATION: Error processing simulated payment:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Simulated payment processing error',
        simulation: true,
        details: {
          reason: 'processing_error',
          message: 'An error occurred while processing the simulated payment.',
        }
      });
    }
  } catch (error) {
    console.error('Simulate payment error:', error);
    
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

// GET endpoint to check simulation capabilities
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const info = url.searchParams.get('info');

  if (info === 'status') {
    return NextResponse.json({
      simulation_mode: true,
      stripe_configured: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY),
      available_simulations: ['success', 'failure'],
      supported_scenarios: [
        'successful_payment',
        'card_declined',
        'insufficient_funds',
        'processing_error',
        'network_error'
      ],
      note: 'This endpoint simulates Stripe payment processing for development purposes'
    });
  }

  return NextResponse.json({
    message: 'Stripe Payment Simulation Endpoint',
    usage: {
      method: 'POST',
      body: {
        ticketId: 'string (required)',
        simulate: 'success | failure (default: success)',
        delay: 'number (0-10000ms, default: 1000)'
      }
    },
    examples: [
      {
        description: 'Simulate successful payment',
        body: { ticketId: 'ticket-uuid', simulate: 'success', delay: 2000 }
      },
      {
        description: 'Simulate payment failure',
        body: { ticketId: 'ticket-uuid', simulate: 'failure', delay: 1000 }
      }
    ]
  });
}
