import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Extract token from path
    const pathSegments = event.path.split('/');
    const token = pathSegments[pathSegments.length - 1];

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token is required' }),
      };
    }

    const { db } = await import('../../lib/drizzle.server');
    const { tickets, events, attendees, ticketTypes } = await import('../../shared/schema');
    const { eq } = await import('drizzle-orm');

    // Find ticket with all related data
    const [ticketResult] = await db
      .select({
        ticket: tickets,
        event: events,
        attendee: attendees,
        ticketType: ticketTypes,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(eq(tickets.token, token))
      .limit(1);

    if (!ticketResult) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Ticket not found' }),
      };
    }

    const { ticket, event, attendee, ticketType } = ticketResult;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ticket: {
          id: ticket.id,
          token: ticket.token,
          status: ticket.status,
          qrCode: ticket.qrCode,
          checkedIn: ticket.checkedIn,
          checkedInAt: ticket.checkedInAt,
        },
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
        },
        attendee: {
          name: attendee.name,
          email: attendee.email,
          company: attendee.company,
        },
        ticketType: {
          name: ticketType.name,
          price: ticketType.price,
          currency: ticketType.currency,
        },
      }),
    };
  } catch (error) {
    console.error('Ticket lookup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};