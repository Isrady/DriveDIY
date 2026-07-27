import { callClaude, callClaudeStream, parseClaudeJSON } from "@/lib/claude";
import { RESPONSE_DRAFTER_PROMPT } from "./prompts/response-drafter";
import type {
  Contract,
  ContractParty,
  Correspondence,
  LegalRiskOutput,
  ResponseDrafterOutput,
  DraftTone,
} from "@/types";

interface DrafterInput {
  correspondence: Correspondence;
  bodyText: string | null;
  riskOutput: LegalRiskOutput;
  contract: Contract & { parties: ContractParty[] };
  tone: DraftTone;
  language: "en" | "ar" | "en_ar";
  userInstructions?: string;
  correspondenceId?: string;
  userId?: string;
}

function buildPrompt(input: DrafterInput): string {
  const ourParty = input.contract.parties.find((p) => p.is_our_org);
  const theirParty = input.contract.parties.find(
    (p) => !p.is_our_org && p.role === "contractor"
  );

  return `TODAY'S DATE: ${new Date().toISOString().split("T")[0]}

CONTRACT DETAILS:
Title: ${input.contract.title}
Contract No.: ${input.contract.contract_number ?? "N/A"}
Project: ${input.contract.project_name ?? "N/A"}
Contract Type: ${input.contract.contract_type}
Governing Law: ${input.contract.governing_law}
Arbitration: ${input.contract.arbitration_body ?? "Per contract"}
Our Organisation (Employer): ${ourParty?.name ?? "The Employer"}
Contractor: ${theirParty?.name ?? "The Contractor"}

ORIGINAL CORRESPONDENCE:
From: ${input.correspondence.sender_name ?? "Unknown"} <${input.correspondence.sender_contact ?? "unknown"}>
Subject: ${input.correspondence.subject ?? "(no subject)"}
Received: ${input.correspondence.received_at}

${input.bodyText ?? "(no body text)"}

LEGAL RISK ASSESSMENT SUMMARY:
Overall risk level: ${input.riskOutput.overall_risk_level}
${input.riskOutput.flags
  .map(
    (f) =>
      `[${f.severity.toUpperCase()}] ${f.title}: ${f.recommended_action} (${f.fidic_clause_refs.join(", ")} / ${f.uae_law_references.join(", ")})`
  )
  .join("\n")}

Legal memo:
${input.riskOutput.legal_memo}

DRAFTING INSTRUCTIONS:
Tone: ${input.tone}
Language: ${input.language}
${input.userInstructions ? `Additional instructions from user: ${input.userInstructions}` : ""}

Draft a complete, formally-correct response letter and return the structured JSON output per your instructions.`;
}

export async function draftResponse(
  input: DrafterInput
): Promise<ResponseDrafterOutput> {
  const result = await callClaude({
    agentType: "response_drafter",
    system: RESPONSE_DRAFTER_PROMPT,
    messages: [{ role: "user", content: buildPrompt(input) }],
    userId: input.userId,
    entityType: "correspondence",
    entityId: input.correspondenceId,
    maxTokens: 6144,
  });

  return parseClaudeJSON<ResponseDrafterOutput>(result.content);
}

export async function draftResponseStream(
  input: DrafterInput,
  onChunk: (text: string) => void
): Promise<ResponseDrafterOutput> {
  const result = await callClaudeStream(
    {
      agentType: "response_drafter",
      system: RESPONSE_DRAFTER_PROMPT,
      messages: [{ role: "user", content: buildPrompt(input) }],
      userId: input.userId,
      entityType: "correspondence",
      entityId: input.correspondenceId,
      maxTokens: 6144,
    },
    onChunk
  );

  return parseClaudeJSON<ResponseDrafterOutput>(result.content);
}
