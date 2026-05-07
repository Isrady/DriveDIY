import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCRMAgent } from "@/agents/crm";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, sessionId, customerContext, type, message: inboundMessage } = await req.json();

  // Handle inbound WhatsApp
  if (type === "inbound_whatsapp" && inboundMessage) {
    const { from, body } = inboundMessage;
    try {
      const result = await runCRMAgent({
        messages: [
          {
            role: "user",
            content: `Inbound WhatsApp from ${from}: "${body}". Determine appropriate response.`,
          },
        ],
        sessionId: `whatsapp_${from}`,
      });
      return NextResponse.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Agent error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  try {
    const result = await runCRMAgent({
      messages,
      userId: user?.id,
      sessionId,
      customerContext,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
