import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';

const checkinSchema = z.object({
  token: z.string(),
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
    const validatedData = checkinSchema.parse(body);

    const { db } = await import('../../lib/drizzle.server');
    const { tickets, events, attendees } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');

    // Find the ticket
    const [ticketResult] = await db
      .select({
        ticket: tickets,
        event: events,
        attendee: attendees,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .where(eq(tickets.token, validatedData.token))
      .limit(1);

    if (!ticketResult) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Ticket not found' }),
      };
    }

    const { ticket, event, attendee } = ticketResult;

    // Check if ticket is valid for check-in
    if (ticket.status !== 'issued') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Ticket is not valid for check-in',
          status: ticket.status 
        }),
      };
    }

    if (ticket.checkedIn) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Ticket already checked in',
          checkedInAt: ticket.checkedInAt 
        }),
      };
    }

    // Update ticket as checked in
    await db
      .update(tickets)
      .set({ 
        checkedIn: true,
        checkedInAt: new Date().toISOString() 
      })
      .where(eq(tickets.id, ticket.id));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Check-in successful',
        ticket: {
          id: ticket.id,
          token: ticket.token,
          checkedIn: true,
          checkedInAt: new Date().toISOString(),
        },
        attendee: {
          name: attendee.name,
          email: attendee.email,
        },
        event: {
          title: event.title,
          startDate: event.startDate,
        },
      }),
    };
  } catch (error) {
    console.error('Check-in error:', error);
    
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