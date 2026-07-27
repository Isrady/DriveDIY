import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { fetchNewMessages } from "@/lib/email/gmail";
import { runCorrespondenceAnalysis } from "@/lib/agents/orchestrator";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const accountId = body.account_id;

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = admin
    .from("email_accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);
  if (accountId) query = query.eq("id", accountId);

  const { data: accounts } = await query;
  if (!accounts?.length) return NextResponse.json({ error: "No active email accounts" }, { status: 400 });

  let total = 0;

  for (const account of accounts) {
    try {
      const messages = await fetchNewMessages(account, account.gmail_history_id ?? "1");

      for (const msg of messages) {
        const { data: corr } = await admin
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
          runCorrespondenceAnalysis(corr.id, user.id).catch(console.error);
          total++;
        }
      }

      await admin
        .from("email_accounts")
        .update({ last_synced_at: new Date().toISOString(), sync_error: null })
        .eq("id", account.id);
    } catch (err) {
      await admin
        .from("email_accounts")
        .update({ sync_error: String(err) })
        .eq("id", account.id);
    }
  }

  return NextResponse.json({ message: `Synced ${total} new messages`, count: total });
}
