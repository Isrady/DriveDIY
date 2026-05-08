import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCommanderAgent } from "@/agents/commander";
import { runDevAgent } from "@/agents/dev";
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
          const commanderResult = await runCommanderAgent({
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

          // If Commander routed to Dev, call the Dev Agent and stream its response too
          if (commanderResult.route_to === "dev") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ route_to: "dev", chunk: "\n\n[Dev Agent]\n" })}\n\n`
              )
            );
            const devPayload =
              (commanderResult.agent_payload as Anthropic.MessageParam[] | null) ??
              anthropicMessages;

            const devResult = await runDevAgent({
              messages: Array.isArray(devPayload) ? devPayload : anthropicMessages,
              userId: user.id,
              sessionId,
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ chunk: devResult.message, dev_result: devResult })}\n\n`
              )
            );
          }

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
    const commanderResult = await runCommanderAgent({
      messages: anthropicMessages,
      userId: user.id,
      sessionId,
    });

    // If Commander decides to route to Dev, run the Dev Agent and attach its result
    if (commanderResult.route_to === "dev") {
      const devPayload =
        (commanderResult.agent_payload as Anthropic.MessageParam[] | null) ??
        anthropicMessages;

      const devResult = await runDevAgent({
        messages: Array.isArray(devPayload) ? devPayload : anthropicMessages,
        userId: user.id,
        sessionId,
      });

      return NextResponse.json({ ...commanderResult, dev_result: devResult });
    }

    return NextResponse.json(commanderResult);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
