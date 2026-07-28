import { NextRequest, NextResponse } from "next/server";
import { validateTwilioSignature, sendWhatsAppMessage } from "@/lib/twilio";
import { runCRMAgent } from "@/agents/crm";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(bodyText).entries()) {
    params[k] = v;
  }

  const twilioSignature = req.headers.get("X-Twilio-Signature") ?? "";
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

  const isValid = validateTwilioSignature(twilioSignature, webhookUrl, params);
  if (!isValid && process.env.NODE_ENV === "production") {
    return new NextResponse("Invalid Twilio signature", { status: 403 });
  }

  const from = params.From?.replace("whatsapp:", "") ?? "";
  const body = params.Body ?? "";

  // Call CRM agent directly — no HTTP round-trip, no auth needed
  try {
    const result = await runCRMAgent({
      messages: [
        {
          role: "user",
          content: `Inbound WhatsApp from ${from}: "${body}". Draft a reply message for this customer.`,
        },
      ],
      sessionId: `whatsapp_${from}`,
    });

    // Send the CRM agent's reply back via WhatsApp
    if (result.message && from) {
      await sendWhatsAppMessage(from, result.message);
    }
  } catch (err) {
    console.error("CRM agent error for inbound WhatsApp:", err);
  }

  // Respond to Twilio immediately — reply already sent above
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } }
  );
}

