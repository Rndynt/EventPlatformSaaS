import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';

const paymentIntentSchema = z.object({
  ticketId: z.string().uuid(),
});

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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
    const validatedData = paymentIntentSchema.parse(body);

    // Get ticket and pricing from database (server-side security)
    const { db } = await import('../../lib/drizzle.server');
    const { tickets, ticketTypes } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');

    const [ticketResult] = await db
      .select({
        ticket: tickets,
        ticketType: ticketTypes,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(eq(tickets.id, validatedData.ticketId))
      .limit(1);

    if (!ticketResult) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Ticket not found' }),
      };
    }

    const { ticket, ticketType } = ticketResult;

    if (ticket.status !== 'pending') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ticket is not pending payment' }),
      };
    }

    if (!ticketType.isPaid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Ticket type is not paid' }),
      };
    }

    // Use server-side pricing (security)
    const amount = Math.round(parseFloat(ticketType.price) * 100);
    const currency = ticketType.currency;

    const { createPaymentIntent } = await import('../../lib/stripe');

    const clientSecret = await createPaymentIntent({
      amount,
      currency: currency.toLowerCase(),
      metadata: {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        attendeeId: ticket.attendeeId,
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        clientSecret,
        amount,
        currency,
      }),
    };
  } catch (error) {
    console.error('Payment intent error:', error);
    
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