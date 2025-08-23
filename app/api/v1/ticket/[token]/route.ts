import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle.server';
import { tickets, attendees, events, ticketTypes } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { validateTicketToken } from '@/lib/qr';

interface Props {
  params: {
    token: string;
  };
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { token } = params;

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
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
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
          error: 'Invalid ticket status',
          status: ticketData.tickets.status
        },
        { status: 400 }
      );
    }

    // Return ticket information for check-in
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticketData.tickets.id,
        token: ticketData.tickets.token,
        status: ticketData.tickets.status,
        checkedInAt: ticketData.tickets.checkedInAt,
        qrCode: ticketData.tickets.qrCode,
      },
      attendee: {
        name: ticketData.attendees.name,
        email: ticketData.attendees.email,
        phone: ticketData.attendees.phone,
        company: ticketData.attendees.company,
      },
      event: {
        title: ticketData.events.title,
        type: ticketData.events.type,
        startDate: ticketData.events.startDate,
        endDate: ticketData.events.endDate,
        location: ticketData.events.location,
      },
      ticketType: {
        name: ticketData.ticket_types.name,
        description: ticketData.ticket_types.description,
        perks: ticketData.ticket_types.perks,
      }
    });
  } catch (error) {
    console.error('Ticket validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
