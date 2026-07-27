import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runCorrespondenceAnalysis } from "@/lib/agents/orchestrator";

export const maxDuration = 30;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface PubSubMessage {
  data: string;
  messageId: string;
}

export async function POST(request: NextRequest) {
  // Verify the request is from Google Pub/Sub
  const token = new URL(request.url).searchParams.get("token");
  if (token !== process.env.GMAIL_PUBSUB_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json() as { message: PubSubMessage };
  const decoded = JSON.parse(Buffer.from(body.message.data, "base64").toString());
  const emailAddress = decoded.emailAddress as string;
  const historyId = decoded.historyId as string;

  if (!emailAddress || !historyId) {
    return NextResponse.json({ ok: true }); // Ack to prevent retry
  }

  const db = getAdmin();

  // Find the email account
  const { data: account } = await db
    .from("email_accounts")
    .select("*")
    .eq("email_address", emailAddress)
    .eq("is_active", true)
    .single();

  if (!account) {
    return NextResponse.json({ ok: true });
  }

  // Dynamic import to avoid build-time auth issues
  const { fetchNewMessages } = await import("@/lib/email/gmail");

  fetchNewMessages(account, historyId)
    .then(async (messages) => {
      for (const msg of messages) {
        const { data: corr } = await db
          .from("correspondence")
          .insert({
            channel: "email",
            direction: msg.direction,
            email_account_id: account.id,
            external_id: msg.messageId,
            thread_id: msg.threadId,
            subject: msg.subject,
            body_text: msg.bodyText,
            body_html: msg.bodyHtml,
            sender_name: msg.senderName,
            sender_contact: msg.senderEmail,
            recipient_contacts: msg.recipients,
            cc_contacts: msg.cc,
            received_at: msg.receivedAt,
            analysis_status: "pending",
          })
          .select()
          .single();

        if (corr) {
          runCorrespondenceAnalysis(corr.id, account.user_id).catch(console.error);
        }
      }

      // Update historyId
      await db
        .from("email_accounts")
        .update({ gmail_history_id: historyId, last_synced_at: new Date().toISOString() })
        .eq("id", account.id);
    })
    .catch(console.error);

  return NextResponse.json({ ok: true });
}
