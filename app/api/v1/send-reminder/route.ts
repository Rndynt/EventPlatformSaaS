import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/drizzle.server';
import { events, tickets, attendees } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail, generateReminderEmail } from '@/lib/mail';
import { sendSMS, generateReminderSMS } from '@/lib/sms';

const reminderSchema = z.object({
  eventId: z.string().uuid(),
  when: z.enum(['24h', '1h', 'custom']),
  customMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, when, customMessage } = reminderSchema.parse(body);

    // Find event
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

    // Get all issued tickets for this event
    const eventTickets = await db
      .select()
      .from(tickets)
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .where(
        and(
          eq(tickets.eventId, eventId),
          eq(tickets.status, 'issued')
        )
      );

    if (eventTickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No issued tickets found for this event',
        remindersSent: 0
      });
    }

    let emailCount = 0;
    let smsCount = 0;
    const errors: string[] = [];

    // Format event date
    const eventDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(event.startDate));

    // Event link (this would be the actual event page URL)
    const eventLink = `${process.env.NEXT_PUBLIC_BASE_URL}/events/${event.slug}`;

    // Send reminders to all attendees
    for (const ticketData of eventTickets) {
      const attendee = ticketData.attendees;

      try {
        // Send email reminder
        let emailSubject = '';
        let emailContent = '';

        if (customMessage) {
          emailSubject = `Event Reminder: ${event.title}`;
          emailContent = `
            <p>Hi ${attendee.name},</p>
            <p>${customMessage}</p>
            <p><strong>Event:</strong> ${event.title}</p>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><a href="${eventLink}">View Event Details</a></p>
          `;
        } else {
          const timeText = when === '24h' ? '24 hours' : when === '1h' ? '1 hour' : '';
          emailSubject = `Reminder: ${event.title} ${timeText ? `in ${timeText}` : ''}`;
          emailContent = generateReminderEmail(
            attendee.name,
            event.title,
            eventDate,
            eventLink
          );
        }

        const emailSent = await sendEmail({
          to: attendee.email,
          subject: emailSubject,
          html: emailContent,
        });

        if (emailSent) {
          emailCount++;
        } else {
          errors.push(`Failed to send email to ${attendee.email}`);
        }

        // Send SMS reminder if phone number is available
        if (attendee.phone) {
          const smsMessage = customMessage || generateReminderSMS(
            attendee.name,
            event.title,
            eventDate
          );

          const smsSent = await sendSMS({
            to: attendee.phone,
            message: smsMessage,
          });

          if (smsSent) {
            smsCount++;
          } else {
            errors.push(`Failed to send SMS to ${attendee.phone}`);
          }
        }
      } catch (error) {
        console.error(`Error sending reminder to ${attendee.email}:`, error);
        errors.push(`Error processing reminder for ${attendee.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminders sent successfully',
      remindersSent: emailCount + smsCount,
      emailsSent: emailCount,
      smsSent: smsCount,
      totalAttendees: eventTickets.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    
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
