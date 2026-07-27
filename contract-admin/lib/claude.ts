import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { AgentType } from "@/types";

const MODEL_STANDARD = "claude-sonnet-4-5";
const MODEL_DEEP = "claude-opus-4-5";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export interface CallClaudeOptions {
  agentType: AgentType;
  system: string;
  messages: Anthropic.MessageParam[];
  userId?: string;
  entityType?: "contract" | "correspondence";
  entityId?: string;
  maxTokens?: number;
  useDeepModel?: boolean;
}

export interface CallClaudeResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export async function callClaude(
  options: CallClaudeOptions
): Promise<CallClaudeResult> {
  const {
    agentType,
    system,
    messages,
    userId,
    entityType,
    entityId,
    maxTokens = 4096,
    useDeepModel = false,
  } = options;

  const model = useDeepModel ? MODEL_DEEP : MODEL_STANDARD;
  const startTime = Date.now();
  const anthropic = getAnthropic();
  const supabaseAdmin = getSupabaseAdmin();

  const logId = crypto.randomUUID();
  supabaseAdmin.from("agent_logs").insert({
    id: logId,
    agent_type: agentType,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    user_id: userId ?? null,
    status: "started",
    model,
    input_tokens: 0,
    output_tokens: 0,
    prompt_summary: messages[0]
      ? String(messages[0].content).slice(0, 200)
      : null,
  }).then();

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";
    const latencyMs = Date.now() - startTime;

    supabaseAdmin.from("agent_logs").update({
      status: "completed",
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      duration_ms: latencyMs,
      response_summary: content.slice(0, 200),
    }).eq("id", logId).then();

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    supabaseAdmin.from("agent_logs").update({
      status: "failed",
      duration_ms: latencyMs,
      error_message: errorMsg,
    }).eq("id", logId).then();

    throw error;
  }
}

export async function callClaudeStream(
  options: CallClaudeOptions,
  onChunk: (text: string) => void
): Promise<CallClaudeResult> {
  const {
    agentType,
    system,
    messages,
    userId,
    entityType,
    entityId,
    maxTokens = 4096,
    useDeepModel = false,
  } = options;

  const model = useDeepModel ? MODEL_DEEP : MODEL_STANDARD;
  const startTime = Date.now();
  let fullContent = "";
  const anthropic = getAnthropic();
  const supabaseAdmin = getSupabaseAdmin();

  const logId = crypto.randomUUID();
  supabaseAdmin.from("agent_logs").insert({
    id: logId,
    agent_type: agentType,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    user_id: userId ?? null,
    status: "started",
    model,
    input_tokens: 0,
    output_tokens: 0,
  }).then();

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullContent += chunk.delta.text;
      onChunk(chunk.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  const latencyMs = Date.now() - startTime;

  supabaseAdmin.from("agent_logs").update({
    status: "completed",
    input_tokens: finalMessage.usage.input_tokens,
    output_tokens: finalMessage.usage.output_tokens,
    duration_ms: latencyMs,
    response_summary: fullContent.slice(0, 200),
  }).eq("id", logId).then();

  return {
    content: fullContent,
    inputTokens: finalMessage.usage.input_tokens,
    outputTokens: finalMessage.usage.output_tokens,
    latencyMs,
  };
}

export function parseClaudeJSON<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    // Strip markdown code fences if present
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1].trim()) as T;
    }
    // Extract bare JSON object
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }
    throw new Error(`Failed to parse Claude response as JSON: ${content.slice(0, 500)}`);
  }
}
