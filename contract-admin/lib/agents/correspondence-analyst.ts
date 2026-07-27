import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { CORRESPONDENCE_ANALYST_PROMPT } from "./prompts/correspondence-analyst";
import type {
  Contract,
  ContractParty,
  ContractClause,
  CorrespondenceAnalystOutput,
} from "@/types";

interface AnalystInput {
  subject: string | null;
  bodyText: string | null;
  senderName: string | null;
  senderContact: string | null;
  receivedAt: string;
  channel: "email" | "whatsapp" | "manual";
  contracts: Array<
    Contract & { parties: ContractParty[]; key_clauses: ContractClause[] }
  >;
  correspondenceId?: string;
  userId?: string;
}

export async function analyzeCorrespondence(
  input: AnalystInput
): Promise<CorrespondenceAnalystOutput> {
  const contractRoster = input.contracts.map((c) => ({
    id: c.id,
    title: c.title,
    contract_number: c.contract_number,
    project_name: c.project_name,
    status: c.status,
    commencement_date: c.commencement_date,
    current_completion_date: c.current_completion_date,
    parties: c.parties.map((p) => ({
      role: p.role,
      name: p.name,
      contact_emails: p.contact_emails,
      contact_phones: p.contact_phones,
      contact_person: p.contact_person,
    })),
    time_critical_clauses: c.key_clauses
      .filter((cl) => cl.notice_days || cl.time_bar_days || cl.response_days)
      .slice(0, 15)
      .map((cl) => ({
        clause_number: cl.clause_number,
        clause_type: cl.clause_type,
        summary: cl.summary,
        notice_days: cl.notice_days,
        time_bar_days: cl.time_bar_days,
        response_days: cl.response_days,
      })),
  }));

  const result = await callClaude({
    agentType: "correspondence_analyst",
    system: CORRESPONDENCE_ANALYST_PROMPT,
    messages: [
      {
        role: "user",
        content: `CURRENT DATE-TIME: ${input.receivedAt}
CHANNEL: ${input.channel}

ACTIVE CONTRACTS ROSTER:
${JSON.stringify(contractRoster, null, 2)}

CORRESPONDENCE TO ANALYZE:
From: ${input.senderName ?? "Unknown"} <${input.senderContact ?? "unknown"}>
Subject: ${input.subject ?? "(no subject)"}
Received: ${input.receivedAt}

Body:
${input.bodyText ?? "(no body text)"}

Analyze this correspondence and return the structured JSON output per your instructions.`,
      },
    ],
    userId: input.userId,
    entityType: "correspondence",
    entityId: input.correspondenceId,
    maxTokens: 4096,
  });

  return parseClaudeJSON<CorrespondenceAnalystOutput>(result.content);
}
