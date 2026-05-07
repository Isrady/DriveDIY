import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";

  const { data, error } = await getSupabaseAdmin()
    .from("pending_permissions")
    .select("*")
    .eq("status", status)
    .order("requested_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ permissions: data });
}

export async function POST(req: NextRequest) {
  // Called internally by agents — uses service role
  const body = await req.json();
  const { agent, action, description, payload } = body;

  if (!agent || !action || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("pending_permissions")
    .insert({ agent, action, description, payload: payload ?? {} })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Emit realtime event
  await getSupabaseAdmin().from("events").insert({
    event_type: "permission_requested",
    title: `${agent} requesting: ${action}`,
    body: description,
    entity_type: "permission",
    entity_id: data.id,
  });

  return NextResponse.json({ permission: data });
}
