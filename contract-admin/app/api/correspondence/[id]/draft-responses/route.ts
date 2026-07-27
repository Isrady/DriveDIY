import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { draftResponse } from "@/lib/agents/response-drafter";
import type { Contract, ContractParty, Correspondence, LegalRiskOutput, DraftTone } from "@/types";

export const maxDuration = 120;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("draft_responses")
    .select("*")
    .eq("correspondence_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const tone: DraftTone = body.tone ?? "formal";
  const language = body.language ?? "en";

  // Load correspondence
  const { data: corr } = await supabase
    .from("correspondence")
    .select("*")
    .eq("id", id)
    .single();
  if (!corr) return NextResponse.json({ error: "Correspondence not found" }, { status: 404 });

  if (!corr.contract_id) {
    return NextResponse.json({ error: "Correspondence has no linked contract" }, { status: 400 });
  }

  // Load contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("*, parties:contract_parties(*)")
    .eq("id", corr.contract_id)
    .single();
  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });

  // Load legal flags for risk context
  const { data: flags } = await supabase
    .from("legal_flags")
    .select("*")
    .eq("correspondence_id", id);

  const mockRiskOutput: LegalRiskOutput = {
    overall_risk_level: corr.risk_level ?? "medium",
    flags: (flags ?? []).map((f) => ({
      flag_type: f.flag_type,
      severity: f.severity,
      title: f.title,
      description: f.description ?? "",
      current_risk_narrative: f.current_risk_narrative ?? "",
      future_risk_narrative: f.future_risk_narrative ?? "",
      uae_law_references: f.uae_law_references ?? [],
      fidic_clause_refs: f.fidic_clause_refs ?? [],
      action_deadline: f.action_deadline,
      recommended_action: f.recommended_action ?? "",
      recommended_response_type: f.recommended_response_type ?? "",
    })),
    legal_memo: "",
  };

  const draftOutput = await draftResponse({
    correspondence: corr as Correspondence,
    bodyText: corr.body_text,
    riskOutput: mockRiskOutput,
    contract: contract as Contract & { parties: ContractParty[] },
    tone,
    language,
    userInstructions: body.instructions,
    correspondenceId: id,
    userId: user.id,
  });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: draft, error } = await admin
    .from("draft_responses")
    .insert({
      correspondence_id: id,
      contract_id: corr.contract_id,
      subject: draftOutput.subject,
      draft_content: draftOutput.draft_content,
      response_type: draftOutput.response_type,
      tone: draftOutput.tone,
      cited_clauses: draftOutput.cited_clauses,
      cited_uae_laws: draftOutput.cited_uae_laws,
      cited_fidic_clauses: draftOutput.cited_fidic_clauses,
      language,
      status: "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ draft }, { status: 201 });
}
