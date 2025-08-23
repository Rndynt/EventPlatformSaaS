import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { events, tickets, transactions, attendees } from '@/shared/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

const analyticsSchema = z.object({
  eventId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  action: z.enum(['visit', 'register', 'purchase', 'checkin']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, tenantId, action, startDate, endDate } = analyticsSchema.parse(body);

    // For now, we'll track basic metrics from existing data
    // In a production app, you'd want a dedicated analytics table

    if (eventId) {
      // Get event-specific analytics
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      // Get ticket statistics
      const ticketStats = await db
        .select({
          total: sql<number>`count(*)`,
          issued: sql<number>`count(case when status = 'issued' then 1 end)`,
          pending: sql<number>`count(case when status = 'pending' then 1 end)`,
          checkedIn: sql<number>`count(case when checked_in_at is not null then 1 end)`,
        })
        .from(tickets)
        .where(eq(tickets.eventId, eventId))
        .groupBy()
        .then(rows => rows[0] || { total: 0, issued: 0, pending: 0, checkedIn: 0 });

      // Get revenue statistics
      const revenueStats = await db
        .select({
          totalRevenue: sql<number>`coalesce(sum(amount), 0)`,
          completedRevenue: sql<number>`coalesce(sum(case when status = 'completed' then amount else 0 end), 0)`,
          pendingRevenue: sql<number>`coalesce(sum(case when status = 'pending' then amount else 0 end), 0)`,
        })
        .from(transactions)
        .innerJoin(tickets, eq(transactions.ticketId, tickets.id))
        .where(eq(tickets.eventId, eventId))
        .groupBy()
        .then(rows => rows[0] || { totalRevenue: 0, completedRevenue: 0, pendingRevenue: 0 });

      return NextResponse.json({
        success: true,
        event: {
          id: event.id,
          title: event.title,
          type: event.type,
          startDate: event.startDate,
          capacity: event.capacity,
        },
        tickets: {
          total: Number(ticketStats.total),
          issued: Number(ticketStats.issued),
          pending: Number(ticketStats.pending),
          checkedIn: Number(ticketStats.checkedIn),
          conversionRate: ticketStats.total > 0 ? (Number(ticketStats.issued) / Number(ticketStats.total)) * 100 : 0,
          checkinRate: ticketStats.issued > 0 ? (Number(ticketStats.checkedIn) / Number(ticketStats.issued)) * 100 : 0,
        },
        revenue: {
          total: Number(revenueStats.totalRevenue),
          completed: Number(revenueStats.completedRevenue),
          pending: Number(revenueStats.pendingRevenue),
        },
      });
    }

    // If no specific event, return tenant-wide analytics
    if (tenantId) {
      const tenantEvents = await db
        .select({
          eventId: events.id,
          eventTitle: events.title,
          eventType: events.type,
          ticketCount: sql<number>`count(${tickets.id})`,
          checkedInCount: sql<number>`count(case when ${tickets.checkedInAt} is not null then 1 end)`,
          revenue: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
        })
        .from(events)
        .leftJoin(tickets, eq(events.id, tickets.eventId))
        .leftJoin(transactions, and(
          eq(transactions.ticketId, tickets.id),
          eq(transactions.status, 'completed')
        ))
        .where(eq(events.tenantId, tenantId))
        .groupBy(events.id, events.title, events.type);

      const summary = {
        totalEvents: tenantEvents.length,
        totalTickets: tenantEvents.reduce((sum, event) => sum + Number(event.ticketCount), 0),
        totalCheckedIn: tenantEvents.reduce((sum, event) => sum + Number(event.checkedInCount), 0),
        totalRevenue: tenantEvents.reduce((sum, event) => sum + Number(event.revenue), 0),
      };

      return NextResponse.json({
        success: true,
        summary,
        events: tenantEvents.map(event => ({
          id: event.eventId,
          title: event.eventTitle,
          type: event.eventType,
          tickets: Number(event.ticketCount),
          checkedIn: Number(event.checkedInCount),
          revenue: Number(event.revenue),
        })),
      });
    }

    return NextResponse.json(
      { error: 'Either eventId or tenantId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Analytics error:', error);
    
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

export async function GET(request: NextRequest) {
  // Simple endpoint to log visit analytics
  const url = new URL(request.url);
  const eventId = url.searchParams.get('eventId');
  const action = url.searchParams.get('action') || 'visit';

  // In a real app, you'd store this in an analytics table
  console.log('📊 Analytics event:', {
    action,
    eventId,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for'),
  });

  return NextResponse.json({ success: true });
}
