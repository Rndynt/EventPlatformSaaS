import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { events, attendees, tickets, transactions } from '@/shared/schema';
import { eq, and, sql, gte, count, sum } from 'drizzle-orm';
import { verifyJWT } from '@/lib/auth';

const analyticsSchema = z.object({
  tenantId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('auth-token')?.value;
  
  return cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = getAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, eventId, startDate, endDate } = analyticsSchema.parse(body);

    // Verify user has access to this tenant
    if (payload.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate date range
    const startDateTime = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDateTime = endDate ? new Date(endDate) : new Date();

    // Get event stats
    const eventStats = await db
      .select({
        totalEvents: count(events.id),
      })
      .from(events)
      .where(
        and(
          eq(events.tenantId, tenantId),
          gte(events.createdAt, startDateTime)
        )
      );

    // Get registration stats
    const registrationStats = await db
      .select({
        totalRegistrations: count(attendees.id),
      })
      .from(attendees)
      .innerJoin(events, eq(attendees.eventId, events.id))
      .where(
        and(
          eq(events.tenantId, tenantId),
          gte(attendees.createdAt, startDateTime)
        )
      );

    // Get revenue stats
    const revenueStats = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .innerJoin(events, eq(attendees.eventId, events.id))
      .where(
        and(
          eq(events.tenantId, tenantId),
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, startDateTime)
        )
      );

    // Get events with their stats
    const eventsWithStats = await db
      .select({
        id: events.id,
        title: events.title,
        type: events.type,
        startDate: events.startDate,
        capacity: events.capacity,
        status: events.status,
        registrations: sql<number>`COUNT(${attendees.id})`,
        revenue: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'completed' THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END), 0)`,
      })
      .from(events)
      .leftJoin(attendees, eq(events.id, attendees.eventId))
      .leftJoin(tickets, eq(attendees.id, tickets.attendeeId))
      .leftJoin(transactions, eq(tickets.id, transactions.ticketId))
      .where(
        and(
          eq(events.tenantId, tenantId),
          eventId ? eq(events.id, eventId) : undefined
        )
      )
      .groupBy(events.id)
      .orderBy(events.startDate);

    // Calculate growth stats (comparing with previous period)
    const previousPeriodStart = new Date(startDateTime.getTime() - (endDateTime.getTime() - startDateTime.getTime()));
    
    const previousEventStats = await db
      .select({
        totalEvents: count(events.id),
      })
      .from(events)
      .where(
        and(
          eq(events.tenantId, tenantId),
          gte(events.createdAt, previousPeriodStart),
          gte(startDateTime, events.createdAt)
        )
      );

    const previousRegistrationStats = await db
      .select({
        totalRegistrations: count(attendees.id),
      })
      .from(attendees)
      .innerJoin(events, eq(attendees.eventId, events.id))
      .where(
        and(
          eq(events.tenantId, tenantId),
          gte(attendees.createdAt, previousPeriodStart),
          gte(startDateTime, attendees.createdAt)
        )
      );

    const previousRevenueStats = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL)), 0)`,
      })
      .from(transactions)
      .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .innerJoin(events, eq(attendees.eventId, events.id))
      .where(
        and(
          eq(events.tenantId, tenantId),
          eq(transactions.status, 'completed'),
          gte(transactions.createdAt, previousPeriodStart),
          gte(startDateTime, transactions.createdAt)
        )
      );

    // Calculate growth percentages
    const currentEvents = eventStats[0]?.totalEvents || 0;
    const previousEvents = previousEventStats[0]?.totalEvents || 0;
    const eventGrowth = previousEvents > 0 ? ((currentEvents - previousEvents) / previousEvents) * 100 : 0;

    const currentRegistrations = registrationStats[0]?.totalRegistrations || 0;
    const previousRegistrations = previousRegistrationStats[0]?.totalRegistrations || 0;
    const registrationGrowth = previousRegistrations > 0 ? ((currentRegistrations - previousRegistrations) / previousRegistrations) * 100 : 0;

    const currentRevenue = Number(revenueStats[0]?.totalRevenue || 0);
    const previousRevenue = Number(previousRevenueStats[0]?.totalRevenue || 0);
    const revenueGrowth = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalEvents: currentEvents,
        totalRegistrations: currentRegistrations,
        totalRevenue: currentRevenue,
        avgRating: 4.5, // Mock data for now
        growthStats: {
          events: Math.round(eventGrowth * 100) / 100,
          registrations: Math.round(registrationGrowth * 100) / 100,
          revenue: Math.round(revenueGrowth * 100) / 100,
        },
        events: eventsWithStats.map(event => ({
          id: event.id,
          title: event.title,
          type: event.type,
          date: event.startDate.toISOString(),
          registrations: Number(event.registrations),
          capacity: event.capacity,
          revenue: Number(event.revenue),
          status: event.status,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}