import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");
  const contractId = searchParams.get("contract_id");
  const isResolved = searchParams.get("is_resolved");

  let query = supabase
    .from("legal_flags")
    .select("*, contract:contracts(id, title, contract_number), correspondence:correspondence(id, subject, received_at)")
    .order("created_at", { ascending: false });

  if (severity) query = query.eq("severity", severity);
  if (contractId) query = query.eq("contract_id", contractId);
  if (isResolved !== null) query = query.eq("is_resolved", isResolved === "true");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flags: data });
}
