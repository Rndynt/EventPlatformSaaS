import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    // Dev mode logging
    console.log('📧 DEV MODE: Email would be sent');
    console.log('To:', params.to);
    console.log('Subject:', params.subject);
    console.log('HTML:', params.html.substring(0, 200) + '...');
    
    // Log to file for dev mailbox
    const logEntry = {
      timestamp: new Date().toISOString(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text
    };
    
    // In a real implementation, you'd write to a file or memory store
    // For now, just log to console
    return true;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: params.from || SENDGRID_FROM_EMAIL,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid email failed:', error);
    return false;
  }
}

export function generateTicketEmail(
  attendeeName: string,
  eventTitle: string,
  eventDate: string,
  qrCodeData: string,
  ticketToken: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Event Ticket</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366F1;">Your Event Ticket</h1>
      </div>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin-top: 0;">${eventTitle}</h2>
        <p><strong>Attendee:</strong> ${attendeeName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Ticket ID:</strong> ${ticketToken}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <img src="${qrCodeData}" alt="QR Code" style="border: 1px solid #ddd; padding: 10px; background: white;" />
        <p style="font-size: 12px; color: #666;">Present this QR code for check-in</p>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666;">
        <p>Thank you for registering! Please save this email for your records.</p>
      </div>
    </body>
    </html>
  `;
}

export function generateReminderEmail(
  attendeeName: string,
  eventTitle: string,
  eventDate: string,
  eventLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Event Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366F1;">Event Reminder</h1>
      </div>
      
      <p>Hi ${attendeeName},</p>
      
      <p>This is a reminder that you're registered for:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #6366F1;">${eventTitle}</h2>
        <p><strong>Date:</strong> ${eventDate}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${eventLink}" style="background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Event Details
        </a>
      </div>
      
      <p>We look forward to seeing you there!</p>
    </body>
    </html>
  `;
}

export function isSendGridConfigured(): boolean {
  return !!SENDGRID_API_KEY;
}
