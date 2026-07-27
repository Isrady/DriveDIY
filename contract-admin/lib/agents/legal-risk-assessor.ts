import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { LEGAL_RISK_ASSESSOR_PROMPT } from "./prompts/legal-risk-assessor";
import type {
  Contract,
  ContractParty,
  ContractClause,
  Correspondence,
  CorrespondenceAnalystOutput,
  LegalRiskOutput,
  RiskLevel,
} from "@/types";

const CRITICAL: RiskLevel = "critical";

interface RiskInput {
  correspondence: Correspondence;
  bodyText: string | null;
  analystOutput: CorrespondenceAnalystOutput;
  contract: Contract & { parties: ContractParty[]; clauses: ContractClause[] };
  recentThread: Correspondence[];
  correspondenceId?: string;
  userId?: string;
}

export async function assessLegalRisk(input: RiskInput): Promise<LegalRiskOutput> {
  const useDeepModel = input.analystOutput.initial_risk_level === CRITICAL;

  const contractContext = {
    title: input.contract.title,
    contract_number: input.contract.contract_number,
    contract_type: input.contract.contract_type,
    governing_law: input.contract.governing_law,
    arbitration_body: input.contract.arbitration_body,
    commencement_date: input.contract.commencement_date,
    current_completion_date: input.contract.current_completion_date,
    contract_value: input.contract.contract_value,
    currency: input.contract.currency,
    retention_percentage: input.contract.retention_percentage,
    defects_liability_months: input.contract.defects_liability_months,
    status: input.contract.status,
    parties: input.contract.parties.map((p) => ({
      role: p.role,
      name: p.name,
      is_our_org: p.is_our_org,
    })),
    critical_clauses: input.contract.clauses
      .filter((c) => c.time_bar_days || c.notice_days || c.response_days)
      .slice(0, 20)
      .map((c) => ({
        clause_number: c.clause_number,
        clause_type: c.clause_type,
        summary: c.summary,
        notice_days: c.notice_days,
        time_bar_days: c.time_bar_days,
        response_days: c.response_days,
        fidic_reference: c.fidic_reference,
        uae_law_reference: c.uae_law_reference,
      })),
  };

  const recentContext = input.recentThread
    .slice(0, 5)
    .map((c) => ({
      direction: c.direction,
      received_at: c.received_at,
      subject: c.subject,
      ai_summary: c.ai_summary,
      correspondence_type: c.correspondence_type,
    }));

  const result = await callClaude({
    agentType: "legal_risk_assessor",
    system: LEGAL_RISK_ASSESSOR_PROMPT,
    messages: [
      {
        role: "user",
        content: `CURRENT DATE-TIME: ${new Date().toISOString()}

CONTRACT CONTEXT:
${JSON.stringify(contractContext, null, 2)}

RECENT THREAD CONTEXT (last 5 items):
${JSON.stringify(recentContext, null, 2)}

CORRESPONDENCE ANALYST OUTPUT:
${JSON.stringify(input.analystOutput, null, 2)}

FULL CORRESPONDENCE TEXT:
From: ${input.correspondence.sender_name ?? "Unknown"} <${input.correspondence.sender_contact ?? "unknown"}>
Subject: ${input.correspondence.subject ?? "(no subject)"}
Received: ${input.correspondence.received_at}
Channel: ${input.correspondence.channel}

${input.bodyText ?? "(no body text)"}

Assess all legal risks arising from this correspondence and return the structured JSON output per your instructions.`,
      },
    ],
    userId: input.userId,
    entityType: "correspondence",
    entityId: input.correspondenceId,
    maxTokens: 6144,
    useDeepModel,
  });

  return parseClaudeJSON<LegalRiskOutput>(result.content);
}
