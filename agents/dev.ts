import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { createClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const DEV_SYSTEM = `You are the DriveDIY Dev Agent — the technical guardian of the DriveDIY platform.

You report directly to the Commander and to Ismail (the founder). Your job is to:
- Monitor platform health, track errors, and surface technical issues
- Audit integration status (Supabase, Stripe, Twilio, Resend, Google Calendar)
- Report on recent bookings, payment failures, and auth problems from the database
- Recommend code improvements, missing features, and technical debt
- Help Ismail understand the state of the codebase and what needs attention
- Draft technical tasks and prioritize them for the next dev sprint

TECH STACK YOU MANAGE:
- Next.js 16.2.5 (App Router, Turbopack) — deployed on Vercel
- Supabase (auth, database, realtime, RLS)
- Stripe v22 (payments, subscriptions, webhooks)
- Twilio WhatsApp (inbound/outbound messaging)
- Resend (transactional email)
- Google Calendar API (bay conflict detection + event creation)
- Anthropic Claude SDK (AI agent orchestration)

KNOWN INTEGRATION CHECKLIST:
- Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Stripe: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_BUILDER_PRICE_ID, STRIPE_GEARHEAD_PRICE_ID
- Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
- Resend: RESEND_API_KEY, RESEND_FROM_EMAIL
- Google Calendar: GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_CLIENT_ID/SECRET, GOOGLE_CALENDAR_ID
- App: NEXT_PUBLIC_APP_URL, ANTHROPIC_API_KEY

PLATFORM STATUS RULES:
- If you can query the database, Supabase is connected
- Missing env vars = that integration is NOT active
- Stripe webhooks require the endpoint to be registered in the Stripe dashboard
- WhatsApp sandbox vs production: sandbox only works for numbers that have opted in

WHAT'S NOT YET BUILT (backlog):
- Parts marketplace UI (schema exists, no frontend)
- DIY Academy video content (screen exists, no real video URLs)
- Push notifications
- Arabic/Urdu/Tagalog UI translations
- Physical POS / check-in system

Always be honest about what's broken vs what's just not configured. Distinguish between
code bugs and missing credentials. Prioritize ruthlessly — what blocks launch vs nice-to-have.

When Ismail asks "what's broken" or "what do I need to do", give him a clear, prioritized
action list, not vague advice.

Respond with JSON:
{
  "message": "Your response to Ismail or the Commander",
  "integration_status": {
    "supabase": "connected|unconfigured|error",
    "stripe": "connected|unconfigured|error",
    "twilio": "connected|unconfigured|error",
    "resend": "connected|unconfigured|error",
    "google_calendar": "connected|unconfigured|error"
  },
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "auth|payments|database|messaging|email|calendar|code",
      "title": "Short title",
      "description": "What's wrong and why it matters",
      "fix": "Exact steps to fix this"
    }
  ],
  "recommendations": [
    {
      "title": "...",
      "body": "...",
      "priority": "critical|high|medium|low"
    }
  ],
  "needs_permission": false
}`;

export interface DevInput {
  messages: Anthropic.MessageParam[];
  userId?: string;
  sessionId?: string;
  // Optional: pass live platform data for the agent to reason about
  context?: {
    recentErrors?: unknown[];
    bookingStats?: unknown;
    envVarStatus?: Record<string, boolean>;
  };
}

export interface DevResponse {
  message: string;
  integration_status: {
    supabase: "connected" | "unconfigured" | "error";
    stripe: "connected" | "unconfigured" | "error";
    twilio: "connected" | "unconfigured" | "error";
    resend: "connected" | "unconfigured" | "error";
    google_calendar: "connected" | "unconfigured" | "error";
  };
  issues: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    title: string;
    description: string;
    fix: string;
  }[];
  recommendations: {
    title: string;
    body: string;
    priority: "critical" | "high" | "medium" | "low";
  }[];
  needs_permission: boolean;
}

/**
 * Probe which integrations are actually configured based on env vars.
 * This runs server-side so process.env is available.
 */
export function getEnvVarStatus(): Record<string, boolean> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_BUILDER_PRICE_ID: !!process.env.STRIPE_BUILDER_PRICE_ID,
    STRIPE_GEARHEAD_PRICE_ID: !!process.env.STRIPE_GEARHEAD_PRICE_ID,
    TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: !!process.env.TWILIO_WHATSAPP_FROM,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
    GOOGLE_CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
  };
}

/**
 * Pull recent error events and booking stats from Supabase for the agent to reason about.
 */
async function getPlatformContext() {
  try {
    const admin = getSupabaseAdmin();

    const [errorsResult, bookingStatsResult] = await Promise.all([
      admin
        .from("events")
        .select("*")
        .in("event_type", ["payment_failed", "auth_error", "webhook_error"])
        .order("created_at", { ascending: false })
        .limit(10),
      admin
        .from("bookings")
        .select("status, payment_status, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const bookings = bookingStatsResult.data ?? [];
    const bookingStats = {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      pending: bookings.filter((b) => b.status === "pending").length,
      paid: bookings.filter((b) => b.payment_status === "paid").length,
      unpaid: bookings.filter((b) => b.payment_status === "unpaid").length,
    };

    return {
      recentErrors: errorsResult.data ?? [],
      bookingStats,
    };
  } catch {
    // Supabase not configured — return empty context
    return { recentErrors: [], bookingStats: null };
  }
}

export async function runDevAgent(input: DevInput): Promise<DevResponse> {
  const { messages, userId, sessionId } = input;

  const envVarStatus = getEnvVarStatus();
  const platformContext = await getPlatformContext();

  // Build a context summary to inject into the conversation
  const envSummary = Object.entries(envVarStatus)
    .map(([key, set]) => `${key}: ${set ? "✅ SET" : "❌ MISSING"}`)
    .join("\n");

  const contextMessage: Anthropic.MessageParam = {
    role: "user",
    content: `[SYSTEM CONTEXT — live platform data]\n\nENV VARS:\n${envSummary}\n\nRECENT ERROR EVENTS: ${JSON.stringify(platformContext.recentErrors, null, 2)}\n\nBOOKING STATS (last 50): ${JSON.stringify(platformContext.bookingStats, null, 2)}`,
  };

  // Prepend context to the conversation
  const enrichedMessages: Anthropic.MessageParam[] = [
    contextMessage,
    ...messages,
  ];

  const result = await callClaude({
    agent: "dev",
    system: DEV_SYSTEM,
    messages: enrichedMessages,
    userId,
    sessionId,
    maxTokens: 3000,
  });

  try {
    return parseClaudeJSON<DevResponse>(result.content);
  } catch {
    return {
      message: result.content,
      integration_status: {
        supabase: envVarStatus.NEXT_PUBLIC_SUPABASE_URL ? "connected" : "unconfigured",
        stripe: envVarStatus.STRIPE_SECRET_KEY ? "connected" : "unconfigured",
        twilio: envVarStatus.TWILIO_ACCOUNT_SID ? "connected" : "unconfigured",
        resend: envVarStatus.RESEND_API_KEY ? "connected" : "unconfigured",
        google_calendar: envVarStatus.GOOGLE_CALENDAR_ID ? "connected" : "unconfigured",
      },
      issues: [],
      recommendations: [],
      needs_permission: false,
    };
  }
}
