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
    // Verify authentication for admin endpoint
    const { verifyJWT } = await import('./verify-auth');
    
    let authPayload;
    try {
      authPayload = await verifyJWT(event.headers.authorization);
    } catch (authError) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const queryParams = event.queryStringParameters || {};
    const tenantSlug = queryParams.tenant;
    const eventSlug = queryParams.event;

    if (!tenantSlug) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tenant parameter is required' }),
      };
    }

    const { db } = await import('../../lib/drizzle.server');
    const { tickets, events, attendees, ticketTypes, tenants } = await import('../../shared/schema');
    const { eq, and, count, sum, sql } = await import('drizzle-orm');

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Tenant not found' }),
      };
    }

    // Enforce tenant authorization: ensure JWT tenantId matches requested tenant
    if (authPayload.tenantId !== tenant.id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied: tenant mismatch' }),
      };
    }

    let whereConditions = [eq(events.tenantId, tenant.id)];
    
    // Add event filter if specified
    if (eventSlug) {
      whereConditions.push(eq(events.slug, eventSlug));
    }

    // Get basic event statistics
    const eventStats = await db
      .select({
        eventId: events.id,
        eventTitle: events.title,
        eventSlug: events.slug,
        totalTickets: count(tickets.id),
        checkedInTickets: sum(sql`CASE WHEN ${tickets.checkedIn} = true THEN 1 ELSE 0 END`),
        totalRevenue: sum(sql`CASE WHEN ${ticketTypes.isPaid} = true THEN CAST(${ticketTypes.price} AS DECIMAL) ELSE 0 END`),
      })
      .from(events)
      .leftJoin(tickets, eq(events.id, tickets.eventId))
      .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(and(...whereConditions))
      .groupBy(events.id, events.title, events.slug);

    // Get ticket type breakdown
    const ticketTypeStats = await db
      .select({
        eventId: events.id,
        ticketTypeName: ticketTypes.name,
        ticketTypePrice: ticketTypes.price,
        currency: ticketTypes.currency,
        sold: count(tickets.id),
        checkedIn: sum(sql`CASE WHEN ${tickets.checkedIn} = true THEN 1 ELSE 0 END`),
      })
      .from(events)
      .leftJoin(tickets, eq(events.id, tickets.eventId))
      .leftJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(and(...whereConditions))
      .groupBy(events.id, ticketTypes.id, ticketTypes.name, ticketTypes.price, ticketTypes.currency);

    // Get registration trend (last 30 days)
    const registrationTrend = await db
      .select({
        date: sql`DATE(${tickets.createdAt})`,
        count: count(tickets.id),
      })
      .from(events)
      .leftJoin(tickets, eq(events.id, tickets.eventId))
      .where(
        and(
          ...whereConditions,
          sql`${tickets.createdAt} >= NOW() - INTERVAL '30 days'`
        )
      )
      .groupBy(sql`DATE(${tickets.createdAt})`)
      .orderBy(sql`DATE(${tickets.createdAt})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
        },
        analytics: {
          events: eventStats,
          ticketTypes: ticketTypeStats,
          registrationTrend,
          summary: {
            totalEvents: eventStats.length,
            totalTickets: eventStats.reduce((sum, event) => sum + (event.totalTickets || 0), 0),
            totalCheckedIn: eventStats.reduce((sum, event) => sum + (event.checkedInTickets || 0), 0),
            totalRevenue: eventStats.reduce((sum, event) => sum + (event.totalRevenue || 0), 0),
          },
        },
      }),
    };
  } catch (error) {
    console.error('Analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};