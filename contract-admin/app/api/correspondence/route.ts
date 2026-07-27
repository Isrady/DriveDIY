import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel");
  const contractId = searchParams.get("contract_id");
  const department = searchParams.get("department");
  const riskLevel = searchParams.get("risk_level");
  const status = searchParams.get("analysis_status");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  let query = supabase
    .from("correspondence")
    .select("*, contract:contracts(id, title, contract_number)", { count: "exact" })
    .order("received_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (channel) query = query.eq("channel", channel);
  if (contractId) query = query.eq("contract_id", contractId);
  if (department) query = query.eq("department", department);
  if (riskLevel) query = query.eq("risk_level", riskLevel);
  if (status) query = query.eq("analysis_status", status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ correspondence: data, total: count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("correspondence")
    .insert({
      contract_id: body.contract_id ?? null,
      channel: body.channel ?? "manual",
      direction: body.direction ?? "inbound",
      subject: body.subject ?? null,
      body_text: body.body_text ?? null,
      sender_name: body.sender_name ?? null,
      sender_contact: body.sender_contact ?? null,
      recipient_contacts: body.recipient_contacts ?? [],
      received_at: body.received_at ?? new Date().toISOString(),
      analysis_status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ correspondence: data }, { status: 201 });
}
