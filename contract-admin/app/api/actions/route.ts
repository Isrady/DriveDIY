import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const department = searchParams.get("department");
  const contractId = searchParams.get("contract_id");
  const limit = parseInt(searchParams.get("limit") ?? "100");

  let query = supabase
    .from("actions")
    .select("*, contract:contracts(id, title, contract_number)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (department) query = query.eq("department", department);
  if (contractId) query = query.eq("contract_id", contractId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ actions: data });
}
