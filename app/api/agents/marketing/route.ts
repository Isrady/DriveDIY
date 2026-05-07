import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runMarketingAgent } from "@/agents/marketing";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, sessionId } = await req.json();

  try {
    const result = await runMarketingAgent({
      messages,
      userId: user.id,
      sessionId,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Agent error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
