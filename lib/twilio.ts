import twilio from "twilio";

let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!twilioClient) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );
  }
  return twilioClient;
}

function formatWhatsAppNumber(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("971")) return `whatsapp:+${clean}`;
  if (clean.startsWith("0")) return `whatsapp:+971${clean.slice(1)}`;
  return `whatsapp:+${clean}`;
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<string> {
  const client = getClient();
  const msg = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: formatWhatsAppNumber(to),
    body,
  });
  return msg.sid;
}

export async function sendBookingConfirmationWhatsApp(params: {
  to: string;
  customerName: string;
  bayName: string;
  startTime: Date;
  totalAED: number;
  bookingId: string;
}): Promise<string> {
  const dateStr = params.startTime.toLocaleString("en-AE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });

  const body = `✅ *DriveDIY Booking Confirmed*

Hey ${params.customerName}!

Your bay is locked in:
🔧 *${params.bayName}*
📅 ${dateStr}
💰 AED ${params.totalAED}

*Booking ID:* ${params.bookingId.slice(0, 8).toUpperCase()}

📍 Al Quoz, Dubai
🔑 Show this message at check-in

See you in the bay! 🚗💨
— DriveDIY Team`;

  return sendWhatsAppMessage(params.to, body);
}

export async function sendFollowUpWhatsApp(params: {
  to: string;
  customerName: string;
}): Promise<string> {
  const body = `Hey ${params.customerName}! 👋

How did your last session at DriveDIY go? We'd love to hear about your build progress.

Ready to get back in the bay? Book your next slot: drivediy.ae/book

*Your Bay. Your Tools. Your Build.* 🔧`;

  return sendWhatsAppMessage(params.to, body);
}

export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );
}
