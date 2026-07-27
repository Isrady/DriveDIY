import { createClient } from "@supabase/supabase-js";
import { analyzeCorrespondence } from "./correspondence-analyst";
import { assessLegalRisk } from "./legal-risk-assessor";
import { draftResponse } from "./response-drafter";
import type {
  Contract,
  ContractParty,
  ContractClause,
  Correspondence,
  DraftTone,
} from "@/types";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function runCorrespondenceAnalysis(
  correspondenceId: string,
  userId?: string
): Promise<void> {
  const db = getAdmin();

  // Mark as processing
  await db
    .from("correspondence")
    .update({ analysis_status: "processing" })
    .eq("id", correspondenceId);

  try {
    // Load the correspondence
    const { data: corr, error: corrErr } = await db
      .from("correspondence")
      .select("*")
      .eq("id", correspondenceId)
      .single();

    if (corrErr || !corr) throw new Error(`Correspondence not found: ${correspondenceId}`);

    // Load all active contracts with parties and key clauses
    const { data: contracts } = await db
      .from("contracts")
      .select(`
        *,
        parties:contract_parties(*),
        key_clauses:contract_clauses(*)
      `)
      .eq("status", "active");

    const contractList = (contracts ?? []) as Array<
      Contract & { parties: ContractParty[]; key_clauses: ContractClause[] }
    >;

    // === STEP 1: Correspondence Analyst ===
    const analystOutput = await analyzeCorrespondence({
      subject: corr.subject,
      bodyText: corr.body_text,
      senderName: corr.sender_name,
      senderContact: corr.sender_contact,
      receivedAt: corr.received_at,
      channel: corr.channel,
      contracts: contractList,
      correspondenceId,
      userId,
    });

    // Write analyst results
    await db
      .from("correspondence")
      .update({
        contract_id: analystOutput.contract_id,
        contract_match_confidence: analystOutput.contract_match_confidence,
        correspondence_type: analystOutput.correspondence_type,
        department: analystOutput.department,
        requires_response: analystOutput.requires_response,
        response_deadline: analystOutput.response_deadline,
        risk_level: analystOutput.initial_risk_level,
        ai_summary: analystOutput.summary,
      })
      .eq("id", correspondenceId);

    // Write suggested actions
    if (analystOutput.suggested_actions.length > 0) {
      await db.from("actions").insert(
        analystOutput.suggested_actions.map((a) => ({
          contract_id: analystOutput.contract_id,
          correspondence_id: correspondenceId,
          title: a.title,
          description: a.description,
          action_type: a.action_type,
          department: a.department,
          due_date: a.due_date,
          is_hard_deadline: a.is_hard_deadline,
          priority: a.priority,
          linked_clause: a.linked_clause,
          status: "pending",
        }))
      );
    }

    // If no contract matched with high confidence, mark as skipped analysis
    if (!analystOutput.contract_id || analystOutput.contract_match_confidence < 0.5) {
      await db
        .from("correspondence")
        .update({
          analysis_status: "completed",
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", correspondenceId);
      return;
    }

    // === STEP 2: Legal Risk Assessor ===
    // Load the matched contract with full clause data
    const { data: matchedContract } = await db
      .from("contracts")
      .select(`
        *,
        parties:contract_parties(*),
        clauses:contract_clauses(*)
      `)
      .eq("id", analystOutput.contract_id)
      .single();

    if (!matchedContract) throw new Error("Matched contract not found");

    // Load recent thread context
    const { data: recentThread } = await db
      .from("correspondence")
      .select("*")
      .eq("contract_id", analystOutput.contract_id)
      .neq("id", correspondenceId)
      .order("received_at", { ascending: false })
      .limit(5);

    const riskOutput = await assessLegalRisk({
      correspondence: corr as Correspondence,
      bodyText: corr.body_text,
      analystOutput,
      contract: matchedContract as Contract & {
        parties: ContractParty[];
        clauses: ContractClause[];
      },
      recentThread: (recentThread ?? []) as Correspondence[],
      correspondenceId,
      userId,
    });

    // Update risk level with assessor's more informed view
    await db
      .from("correspondence")
      .update({ risk_level: riskOutput.overall_risk_level })
      .eq("id", correspondenceId);

    // Write legal flags
    if (riskOutput.flags.length > 0) {
      await db.from("legal_flags").insert(
        riskOutput.flags.map((f) => ({
          contract_id: analystOutput.contract_id,
          correspondence_id: correspondenceId,
          flag_type: f.flag_type,
          severity: f.severity,
          title: f.title,
          description: f.description,
          current_risk_narrative: f.current_risk_narrative,
          future_risk_narrative: f.future_risk_narrative,
          uae_law_references: f.uae_law_references,
          fidic_clause_refs: f.fidic_clause_refs,
          action_deadline: f.action_deadline,
          recommended_action: f.recommended_action,
          recommended_response_type: f.recommended_response_type,
        }))
      );
    }

    // === STEP 3: Response Drafter (only if response required) ===
    if (analystOutput.requires_response) {
      const tone: DraftTone =
        riskOutput.overall_risk_level === "critical" || riskOutput.overall_risk_level === "high"
          ? "firm"
          : "formal";

      const draftOutput = await draftResponse({
        correspondence: corr as Correspondence,
        bodyText: corr.body_text,
        riskOutput,
        contract: matchedContract as Contract & { parties: ContractParty[] },
        tone,
        language: "en",
        correspondenceId,
        userId,
      });

      await db.from("draft_responses").insert({
        correspondence_id: correspondenceId,
        contract_id: analystOutput.contract_id,
        subject: draftOutput.subject,
        draft_content: draftOutput.draft_content,
        response_type: draftOutput.response_type,
        tone: draftOutput.tone,
        cited_clauses: draftOutput.cited_clauses,
        cited_uae_laws: draftOutput.cited_uae_laws,
        cited_fidic_clauses: draftOutput.cited_fidic_clauses,
        language: "en",
        status: "draft",
      });
    }

    // Mark complete
    await db
      .from("correspondence")
      .update({
        analysis_status: "completed",
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", correspondenceId);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await db
      .from("correspondence")
      .update({
        analysis_status: "failed",
        analysis_error: errorMsg,
      })
      .eq("id", correspondenceId);
    throw error;
  }
}

export async function runContractParse(
  contractId: string,
  pdfText: string,
  contractTypeHint: string,
  userId?: string
): Promise<void> {
  const db = getAdmin();
  const { parseContract } = await import("./contract-parser");

  await db
    .from("contracts")
    .update({ parse_status: "processing" })
    .eq("id", contractId);

  try {
    const parsed = await parseContract(pdfText, contractTypeHint, userId, contractId);

    // Update contract metadata
    await db
      .from("contracts")
      .update({
        title: parsed.contract.title || undefined,
        contract_number: parsed.contract.contract_number || undefined,
        project_name: parsed.contract.project_name || undefined,
        project_location: parsed.contract.project_location || undefined,
        contract_value: parsed.contract.contract_value || undefined,
        currency: parsed.contract.currency || "AED",
        retention_percentage: parsed.contract.retention_percentage || undefined,
        commencement_date: parsed.contract.commencement_date || undefined,
        original_completion_date: parsed.contract.original_completion_date || undefined,
        current_completion_date: parsed.contract.original_completion_date || undefined,
        defects_liability_months: parsed.contract.defects_liability_months || undefined,
        governing_law: parsed.contract.governing_law || "UAE",
        arbitration_body: parsed.contract.arbitration_body || undefined,
        arbitration_seat: parsed.contract.arbitration_seat || "Dubai",
        parse_status: "completed",
        parsed_at: new Date().toISOString(),
      })
      .eq("id", contractId);

    // Insert parties
    if (parsed.parties.length > 0) {
      await db.from("contract_parties").insert(
        parsed.parties.map((p) => ({
          contract_id: contractId,
          role: p.role,
          name: p.name,
          trade_license: p.trade_license ?? null,
          address: p.address ?? null,
          contact_emails: p.contact_emails,
          contact_phones: p.contact_phones,
          contact_person: p.contact_person ?? null,
        }))
      );
    }

    // Insert clauses
    if (parsed.clauses.length > 0) {
      await db.from("contract_clauses").insert(
        parsed.clauses.map((c) => ({
          contract_id: contractId,
          clause_number: c.clause_number,
          clause_title: c.clause_title,
          clause_type: c.clause_type,
          full_text: c.full_text,
          summary: c.summary,
          notice_days: c.notice_days ?? null,
          time_bar_days: c.time_bar_days ?? null,
          response_days: c.response_days ?? null,
          payment_days: c.payment_days ?? null,
          department_relevance: c.department_relevance,
          fidic_reference: c.fidic_reference ?? null,
          uae_law_reference: c.uae_law_reference ?? null,
        }))
      );
    }

    // Insert milestones
    if (parsed.milestones.length > 0) {
      await db.from("contract_milestones").insert(
        parsed.milestones.map((m) => ({
          contract_id: contractId,
          milestone_type: m.milestone_type,
          title: m.title,
          description: m.description,
          due_date: m.due_date,
          linked_clause: m.linked_clause ?? null,
          status: "upcoming",
          is_auto_generated: true,
        }))
      );
    }

    // Insert departments
    if (parsed.departments.length > 0) {
      await db.from("contract_departments").upsert(
        parsed.departments.map((d) => ({
          contract_id: contractId,
          department: d.department,
          notes: d.notes,
        })),
        { onConflict: "contract_id,department" }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    await db
      .from("contracts")
      .update({
        parse_status: "failed",
        parse_error: errorMsg,
      })
      .eq("id", contractId);
    throw error;
  }
}
