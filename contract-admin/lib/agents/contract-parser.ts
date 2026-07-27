import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { CONTRACT_PARSER_PROMPT } from "./prompts/contract-parser";
import type { ContractParserOutput } from "@/types";

export async function parseContract(
  pdfText: string,
  contractTypeHint: string = "FIDIC_RED",
  userId?: string,
  contractId?: string
): Promise<ContractParserOutput> {
  const result = await callClaude({
    agentType: "contract_parser",
    system: CONTRACT_PARSER_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Contract type hint: ${contractTypeHint}\n\nExtract all structured data from the following construction contract text. Pay particular attention to time-critical clauses, notice periods, time bars, and payment timelines.\n\n---CONTRACT TEXT START---\n${pdfText}\n---CONTRACT TEXT END---`,
          },
        ],
      },
    ],
    userId,
    entityType: "contract",
    entityId: contractId,
    maxTokens: 8192,
  });

  return parseClaudeJSON<ContractParserOutput>(result.content);
}
