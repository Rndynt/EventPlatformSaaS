import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export interface SMSParams {
  to: string;
  message: string;
}

export async function sendSMS(params: SMSParams): Promise<boolean> {
  if (!twilioClient || !TWILIO_FROM_NUMBER) {
    // Dev mode logging
    console.log('📱 DEV MODE: SMS would be sent');
    console.log('To:', params.to);
    console.log('Message:', params.message);
    return true;
  }

  try {
    await twilioClient.messages.create({
      from: TWILIO_FROM_NUMBER,
      to: params.to,
      body: params.message,
    });
    
    return true;
  } catch (error) {
    console.error('Twilio SMS failed:', error);
    return false;
  }
}

export function generateReminderSMS(
  attendeeName: string,
  eventTitle: string,
  eventDate: string
): string {
  return `Hi ${attendeeName}, reminder: ${eventTitle} is coming up on ${eventDate}. Don't forget to attend!`;
}

export function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER);
}
