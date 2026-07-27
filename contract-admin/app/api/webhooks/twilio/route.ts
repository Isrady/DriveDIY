import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateTwilioSignature, parseInboundWhatsApp } from "@/lib/whatsapp/twilio";
import { runCorrespondenceAnalysis } from "@/lib/agents/orchestrator";

export const maxDuration = 10;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/twilio";
  const signature = request.headers.get("x-twilio-signature") ?? "";

  // Parse URL-encoded body
  const text = await request.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(text)) {
    params[k] = v;
  }

  // Validate Twilio signature
  if (!validateTwilioSignature(signature, url, params)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const { messageSid, from, text: body } = parseInboundWhatsApp(params);

  const db = getAdmin();

  // Look up known contact
  const { data: contact } = await db
    .from("whatsapp_contacts")
    .select("*")
    .eq("phone_number", from)
    .single();

  // Create correspondence record
  const { data: corr } = await db
    .from("correspondence")
    .insert({
      channel: "whatsapp",
      direction: "inbound",
      external_id: messageSid,
      thread_id: `whatsapp:${from}`,
      body_text: body,
      sender_contact: from,
      sender_name: contact?.display_name ?? from,
      received_at: new Date().toISOString(),
      analysis_status: "pending",
    })
    .select()
    .single();

  // Fire analysis in background — do NOT await (Twilio has 5s timeout)
  if (corr) {
    runCorrespondenceAnalysis(corr.id).catch(console.error);
  }

  // Return TwiML empty response immediately
  return new Response("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
