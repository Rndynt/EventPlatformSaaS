import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function generateTicketToken(): string {
  return `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateTicketToken(token: string): boolean {
  return /^ticket_\d+_[a-z0-9]{9}$/.test(token);
}
