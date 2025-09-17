import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { tickets, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { createPaymentIntent } from '@/lib/stripe';

const paymentIntentSchema = z.object({
  ticketId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId } = paymentIntentSchema.parse(body);

    // Find the ticket and verify it's in pending status
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.status !== 'pending') {
      return NextResponse.json(
        { error: 'Ticket is not in pending status' },
        { status: 400 }
      );
    }

    // Find existing transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.ticketId, ticketId))
      .limit(1);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Create or retrieve payment intent
    const amount = Math.round(parseFloat(transaction.amount) * 100); // Convert to cents
    
    let clientSecret = transaction.stripePaymentIntentId;
    
    if (!clientSecret) {
      clientSecret = await createPaymentIntent({
        amount,
        currency: transaction.currency.toLowerCase(),
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

    return NextResponse.json({
      success: true,
      clientSecret,
      amount,
      currency: transaction.currency,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    
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
