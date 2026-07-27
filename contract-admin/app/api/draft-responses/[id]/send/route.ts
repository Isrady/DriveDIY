import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { sendFormalLetter } from "@/lib/email/sender";
import { sendWhatsAppMessage } from "@/lib/whatsapp/twilio";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const via: "email" | "whatsapp" | "manual" = body.via ?? "email";

  const { data: draft } = await supabase
    .from("draft_responses")
    .select("*")
    .eq("id", id)
    .single();

  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  if (draft.status !== "approved") {
    return NextResponse.json({ error: "Draft must be approved before sending" }, { status: 400 });
  }

  let sentMessageId = "";

  if (via === "email") {
    if (!body.to) return NextResponse.json({ error: "Email 'to' required" }, { status: 400 });
    sentMessageId = await sendFormalLetter({
      to: Array.isArray(body.to) ? body.to : [body.to],
      cc: body.cc,
      subject: draft.subject ?? "Re: Contract Correspondence",
      content: draft.draft_content,
      replyTo: body.reply_to,
    });
  } else if (via === "whatsapp") {
    if (!body.phone) return NextResponse.json({ error: "WhatsApp 'phone' required" }, { status: 400 });
    sentMessageId = await sendWhatsAppMessage(body.phone, draft.draft_content);
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Update draft status
  await admin.from("draft_responses").update({
    status: "sent",
    sent_at: new Date().toISOString(),
    sent_by: user.id,
    sent_via: via,
    sent_message_id: sentMessageId,
  }).eq("id", id);

  // Record as outbound correspondence
  if (draft.correspondence_id) {
    const { data: original } = await admin
      .from("correspondence")
      .select("contract_id, thread_id, sender_contact")
      .eq("id", draft.correspondence_id)
      .single();

    if (original) {
      await admin.from("correspondence").insert({
        contract_id: original.contract_id,
        channel: via === "email" ? "email" : "whatsapp",
        direction: "outbound",
        thread_id: original.thread_id,
        subject: draft.subject,
        body_text: draft.draft_content,
        recipient_contacts: original.sender_contact ? [original.sender_contact] : [],
        received_at: new Date().toISOString(),
        analysis_status: "skipped",
      });
    }
  }

  return NextResponse.json({ message: "Sent successfully", external_id: sentMessageId });
}
