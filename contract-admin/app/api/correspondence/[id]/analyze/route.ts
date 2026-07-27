import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runCorrespondenceAnalysis } from "@/lib/agents/orchestrator";

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fire in background
  runCorrespondenceAnalysis(id, user.id).catch(console.error);

  return NextResponse.json({ message: "Analysis started" });
}
