import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("email_accounts")
    .select("id, email_address, display_name, provider, is_active, last_synced_at, sync_error")
    .eq("user_id", user.id)
    .order("created_at");

  return NextResponse.json({ accounts: data ?? [] });
}
