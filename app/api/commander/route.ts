import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCommanderAgent } from "@/agents/commander";
import type Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, sessionId, stream: useStream } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const anthropicMessages: Anthropic.MessageParam[] = messages;

  if (useStream) {
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          await runCommanderAgent({
            messages: anthropicMessages,
            userId: user.id,
            sessionId,
            stream: true,
            onChunk: (text) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
              );
            },
          });
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Agent error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming
  try {
    const result = await runCommanderAgent({
      messages: anthropicMessages,
      userId: user.id,
      sessionId,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
