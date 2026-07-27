import twilio from "twilio";

function getClient() {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );
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

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<string> {
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_FROM!;

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const fromFormatted = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const message = await client.messages.create({
    from: fromFormatted,
    to: toFormatted,
    body,
  });

  return message.sid;
}

export function parseInboundWhatsApp(body: Record<string, string>): {
  messageSid: string;
  from: string;
  to: string;
  text: string;
  numMedia: number;
  mediaUrls: string[];
} {
  const numMedia = parseInt(body.NumMedia ?? "0", 10);
  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    const url = body[`MediaUrl${i}`];
    if (url) mediaUrls.push(url);
  }

  return {
    messageSid: body.MessageSid ?? "",
    from: (body.From ?? "").replace("whatsapp:", ""),
    to: (body.To ?? "").replace("whatsapp:", ""),
    text: body.Body ?? "",
    numMedia,
    mediaUrls,
  };
}
