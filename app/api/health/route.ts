import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, { ok: boolean; detail: string }> = {};

  // ── 1. Check env vars are present ─────────────────────────────────────────
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  results.env_vars = {
    ok: missing.length === 0,
    detail: missing.length === 0 ? "All required vars present" : `Missing: ${missing.join(", ")}`,
  };

  // ── 2. Test Supabase connection ────────────────────────────────────────────
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await admin.from("users").select("id").limit(1);
    results.supabase = {
      ok: !error,
      detail: error ? error.message : "Connected — users table readable",
    };
  } catch (e) {
    results.supabase = { ok: false, detail: String(e) };
  }

  // ── 3. Test Anthropic API key ──────────────────────────────────────────────
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say OK" }],
    });
    results.anthropic = {
      ok: true,
      detail: `Connected — model: ${msg.model}, tokens used: ${msg.usage.input_tokens}`,
    };
  } catch (e) {
    results.anthropic = { ok: false, detail: String(e) };
  }

  const allOk = Object.values(results).every((r) => r.ok);

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks: results },
    { status: allOk ? 200 : 500 }
  );
}
