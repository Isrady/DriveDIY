import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runDevAgent } from "@/agents/dev";
import type Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Auth check — dev agent is admin-only
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRecord?.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden — Dev Agent is admin only" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { messages, sessionId } = body as {
    messages: Anthropic.MessageParam[];
    sessionId?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  const result = await runDevAgent({
    messages,
    userId: user.id,
    sessionId,
  });

  return NextResponse.json(result);
}
