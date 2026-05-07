import { NextRequest, NextResponse } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  // Parse form-urlencoded body from Twilio
  const bodyText = await req.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(bodyText).entries()) {
    params[k] = v;
  }

  // Validate Twilio signature
  const twilioSignature = req.headers.get("X-Twilio-Signature") ?? "";
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

  const isValid = validateTwilioSignature(twilioSignature, webhookUrl, params);
  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  const inboundMessage = {
    from: params.From?.replace("whatsapp:", "") ?? "",
    body: params.Body ?? "",
    messageSid: params.MessageSid ?? "",
  };

  // Route to CRM agent asynchronously
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  fetch(`${appUrl}/api/agents/crm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "inbound_whatsapp",
      message: inboundMessage,
    }),
  }).catch(console.error);

  // Return empty TwiML — no immediate auto-reply
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    {
      headers: { "Content-Type": "text/xml" },
    }
  );
}
