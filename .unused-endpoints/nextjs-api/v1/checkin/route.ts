import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { tickets, attendees, events } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { validateTicketToken } from '@/lib/qr';

const checkinSchema = z.object({
  token: z.string(),
  gateId: z.string().optional(),
  operatorId: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, gateId, operatorId, notes } = checkinSchema.parse(body);

    // Validate token format
    if (!validateTicketToken(token)) {
      return NextResponse.json(
        { error: 'Invalid ticket token format' },
        { status: 400 }
      );
    }

    // Find ticket with all related data
    const [ticketData] = await db
      .select()
      .from(tickets)
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.token, token))
      .limit(1);

    if (!ticketData) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if ticket is valid for check-in
    if (ticketData.tickets.status !== 'issued') {
      return NextResponse.json(
        { 
          error: 'Ticket is not issued or is invalid',
          status: ticketData.tickets.status,
          details: getStatusMessage(ticketData.tickets.status)
        },
        { status: 400 }
      );
    }

    // Check if already checked in
    if (ticketData.tickets.checkedInAt) {
      return NextResponse.json(
        { 
          error: 'Ticket already checked in',
          checkedInAt: ticketData.tickets.checkedInAt,
          attendee: {
            name: ticketData.attendees.name,
            email: ticketData.attendees.email,
          }
        },
        { status: 400 }
      );
    }

    // Check if event has started (optional validation)
    const now = new Date();
    const eventStart = new Date(ticketData.events.startDate);
    const eventEnd = new Date(ticketData.events.endDate);

    // Allow check-in 2 hours before event start
    const checkinStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);

    if (now < checkinStart) {
      return NextResponse.json(
        { 
          error: 'Check-in not yet available',
          message: `Check-in opens 2 hours before the event starts`,
          eventStart: eventStart.toISOString()
        },
        { status: 400 }
      );
    }

    if (now > eventEnd) {
      return NextResponse.json(
        { 
          error: 'Event has ended',
          message: 'Check-in is no longer available as the event has ended',
          eventEnd: eventEnd.toISOString()
        },
        { status: 400 }
      );
    }

    // Perform check-in
    const checkinTime = new Date();
    
    const [updatedTicket] = await db
      .update(tickets)
      .set({ 
        checkedInAt: checkinTime,
        metadata: ticketData.tickets.metadata ? {
          ...ticketData.tickets.metadata,
          checkinGateId: gateId,
          checkinOperatorId: operatorId,
          checkinNotes: notes,
        } : {
          checkinGateId: gateId,
          checkinOperatorId: operatorId,
          checkinNotes: notes,
        }
      })
      .where(eq(tickets.id, ticketData.tickets.id))
      .returning();

    // Log successful check-in
    console.log('✅ Successful check-in:', {
      ticketToken: token,
      attendeeName: ticketData.attendees.name,
      eventTitle: ticketData.events.title,
      checkinTime: checkinTime.toISOString(),
      gateId,
      operatorId,
    });

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      checkin: {
        timestamp: checkinTime,
        gateId,
        operatorId,
      },
      ticket: {
        id: updatedTicket.id,
        token: updatedTicket.token,
        status: updatedTicket.status,
      },
      attendee: {
        name: ticketData.attendees.name,
        email: ticketData.attendees.email,
        company: ticketData.attendees.company,
      },
      event: {
        title: ticketData.events.title,
        type: ticketData.events.type,
        startDate: ticketData.events.startDate,
        location: ticketData.events.location,
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    
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

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Ticket payment is still pending';
    case 'cancelled':
      return 'Ticket has been cancelled';
    case 'used':
      return 'Ticket has already been used';
    default:
      return 'Ticket status is invalid for check-in';
  }
}

// GET endpoint for checking ticket status without performing check-in
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { error: 'Token parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Find ticket with all related data
    const [ticketData] = await db
      .select()
      .from(tickets)
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.token, token))
      .limit(1);

    if (!ticketData) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketData.tickets.id,
        token: ticketData.tickets.token,
        status: ticketData.tickets.status,
        checkedInAt: ticketData.tickets.checkedInAt,
        canCheckin: ticketData.tickets.status === 'issued' && !ticketData.tickets.checkedInAt,
      },
      attendee: {
        name: ticketData.attendees.name,
        email: ticketData.attendees.email,
        company: ticketData.attendees.company,
      },
      event: {
        title: ticketData.events.title,
        type: ticketData.events.type,
        startDate: ticketData.events.startDate,
        endDate: ticketData.events.endDate,
        location: ticketData.events.location,
      }
    });
  } catch (error) {
    console.error('Ticket status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
