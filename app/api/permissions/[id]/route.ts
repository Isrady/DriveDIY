import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { sendFollowUpEmail } from "@/lib/email";

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, resolution_note } = await req.json();

  if (!["approved", "denied"].includes(status)) {
    return NextResponse.json({ error: "Status must be approved or denied" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("pending_permissions")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_note: resolution_note ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Execute approved action
  if (status === "approved" && data) {
    executeApprovedAction(data).catch(console.error);
  }

  // Emit resolution event
  await getSupabaseAdmin().from("events").insert({
    event_type: `permission_${status}`,
    title: `Permission ${status}: ${data.action}`,
    body: resolution_note ?? null,
    entity_type: "permission",
    entity_id: id,
  });

  return NextResponse.json({ permission: data });
}

async function executeApprovedAction(permission: {
  action: string;
  payload: Record<string, unknown>;
}) {
  const { action, payload } = permission;

  switch (action) {
    case "send_whatsapp_message":
    case "send_whatsapp_broadcast": {
      const { to, body } = payload as { to: string; body: string };
      if (to && body) await sendWhatsAppMessage(to, body);
      break;
    }
    case "send_follow_up_email": {
      const { to, customerName, daysSinceVisit } = payload as {
        to: string;
        customerName: string;
        daysSinceVisit?: number;
      };
      if (to && customerName)
        await sendFollowUpEmail({ to, customerName, daysSinceVisit });
      break;
    }
    default:
      // Unknown action — log it but don't error
      console.log(`Approved action not automatically executed: ${action}`);
  }
}
