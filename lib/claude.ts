import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { AgentName } from "@/types/agents";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const MODEL = "claude-sonnet-4-5";

export interface CallClaudeOptions {
  agent: AgentName;
  system: string;
  messages: Anthropic.MessageParam[];
  userId?: string;
  sessionId?: string;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
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
    agent,
    system,
    messages,
    userId,
    sessionId,
    maxTokens = 4096,
    metadata = {},
  } = options;
  const startTime = Date.now();
  const anthropic = getAnthropic();
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";
    const latencyMs = Date.now() - startTime;

    // Fire-and-forget log
    supabaseAdmin
      .from("agent_logs")
      .insert({
        agent,
        user_id: userId ?? null,
        session_id: sessionId ?? null,
        model: MODEL,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        prompt: JSON.stringify(messages),
        response: content,
        latency_ms: latencyMs,
        metadata,
      })
      .then();

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    await supabaseAdmin.from("agent_logs").insert({
      agent,
      user_id: userId ?? null,
      session_id: sessionId ?? null,
      model: MODEL,
      input_tokens: 0,
      output_tokens: 0,
      prompt: JSON.stringify(messages),
      response: "",
      latency_ms: latencyMs,
      error: errorMsg,
      metadata,
    });

    throw error;
  }
}

export async function callClaudeStream(
  options: CallClaudeOptions,
  onChunk: (text: string) => void
): Promise<CallClaudeResult> {
  const {
    agent,
    system,
    messages,
    userId,
    sessionId,
    maxTokens = 4096,
    metadata = {},
  } = options;
  const startTime = Date.now();
  let fullContent = "";
  const anthropic = getAnthropic();
  const supabaseAdmin = getSupabaseAdmin();

  const stream = anthropic.messages.stream({
    model: MODEL,
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

  supabaseAdmin
    .from("agent_logs")
    .insert({
      agent,
      user_id: userId ?? null,
      session_id: sessionId ?? null,
      model: MODEL,
      input_tokens: finalMessage.usage.input_tokens,
      output_tokens: finalMessage.usage.output_tokens,
      prompt: JSON.stringify(messages),
      response: fullContent,
      latency_ms: latencyMs,
      metadata,
    })
    .then();

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
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error(`Failed to parse Claude response as JSON: ${content}`);
  }
}
