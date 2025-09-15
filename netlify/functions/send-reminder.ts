import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';

const reminderSchema = z.object({
  eventId: z.string().uuid(),
  subject: z.string().min(1),
  message: z.string().min(1),
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

    const body = JSON.parse(event.body || '{}');
    const validatedData = reminderSchema.parse(body);

    const { db } = await import('../../lib/drizzle.server');
    const { tickets, events, attendees } = await import('../../shared/schema');
    const { eq, and } = await import('drizzle-orm');
    const { sendEmail } = await import('../../lib/mail');

    // Verify the event belongs to the authenticated tenant
    const [eventCheck] = await db
      .select({ tenantId: events.tenantId })
      .from(events)
      .where(eq(events.id, validatedData.eventId))
      .limit(1);

    if (!eventCheck) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Event not found' }),
      };
    }

    if (authPayload.tenantId !== eventCheck.tenantId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Access denied: event does not belong to your tenant' }),
      };
    }

    // Find all attendees for the event with issued tickets
    const eventAttendees = await db
      .select({
        attendee: attendees,
        event: events,
        ticket: tickets,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(attendees, eq(tickets.attendeeId, attendees.id))
      .where(
        and(
          eq(tickets.eventId, validatedData.eventId),
          eq(tickets.status, 'issued')
        )
      );

    if (eventAttendees.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No attendees found for this event' }),
      };
    }

    const { event } = eventAttendees[0];
    let successCount = 0;
    let failCount = 0;

    // Send reminder emails to all attendees
    for (const { attendee, ticket } of eventAttendees) {
      try {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${validatedData.subject}</h2>
            
            <p>Hi ${attendee.name},</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${validatedData.message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2c5aa0;">Event Details</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date(event.startDate).toLocaleTimeString()}</p>
              ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
            </div>
            
            <div style="background: #f0f8ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Your Ticket:</strong> ${ticket.token}</p>
              <p style="font-size: 12px; color: #666;">Please bring this email or have your ticket ready for check-in.</p>
            </div>
            
            <p>See you at the event!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              <p>This is an automated reminder email for ${event.title}.</p>
            </div>
          </div>
        `;

        await sendEmail({
          to: attendee.email,
          subject: validatedData.subject,
          html: emailContent,
        });

        successCount++;
      } catch (emailError) {
        console.error(`Failed to send reminder to ${attendee.email}:`, emailError);
        failCount++;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Reminder emails sent',
        stats: {
          total: eventAttendees.length,
          sent: successCount,
          failed: failCount,
        },
        event: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
        },
      }),
    };
  } catch (error) {
    console.error('Send reminder error:', error);
    
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