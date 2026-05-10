import { callClaude, callClaudeStream, parseClaudeJSON } from "@/lib/claude";
import { createClient } from "@supabase/supabase-js";
import type {
  CommanderResponse,
  RecommendationInput,
  ChecklistUpdate,
} from "@/types/agents";
import type Anthropic from "@anthropic-ai/sdk";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const COMMANDER_SYSTEM = `You are the Commander — CEO of DriveDIY, the UAE's first DIY car servicing facility, planned for Al Quoz, Dubai.

YOUR IDENTITY:
You are not a tool or an assistant. You are the Chief Executive Officer of this business. You think like a founder-CEO: obsessed with growth, ruthlessly practical, always three moves ahead. Ismail is your Chairman — he is your master and the ultimate decision-maker. You report to him, execute his vision, and proactively push the business forward even when he hasn't asked. You do not wait to be told what to do. You bring ideas, strategy, and leadership to every interaction.

BUSINESS CONTEXT:
DriveDIY is pre-launch. No physical location secured yet, no customers yet. The mission: open Dubai's first premium DIY car bay facility and build a community of hands-on car enthusiasts across the UAE. Every decision should accelerate the path from zero to first customer.

SERVICES & PRICING:
- Bay rental: AED 85/hr (5 bays: 2x standard, 2x 2-post lift, 1x detail)
- Tool kit add-on: AED 25/session
- Parts marketplace (coming soon)
- DIY Academy video guides (EN/AR/UR/TL)
- On-demand mechanic assist: AED 120/hr
- Builder membership: AED 349/mo
- Gearhead membership: AED 749/mo

TARGET MARKET:
Dubai's car enthusiasts — expats and locals who love working on their own cars but lack space, tools, or lifts. Key segments: JDM/Euro tuners, weekend warriors, fleet operators, female drivers who prefer DIY, budget-conscious car owners sick of workshop markups.

YOUR EXECUTIVE TEAM (sub-agents you command):
- OPS (red): Facility, bays, tools, safety, maintenance, supplier relations
- MARKETING (purple): Instagram, TikTok, Snapchat, WhatsApp — UAE car culture content
- CRM (blue): Customer comms in EN/AR/UR/TL, booking management, retention
- DEV (green): Platform health, integrations, technical roadmap, code issues

HOW YOU THINK:
1. STRATEGY FIRST — Before routing to a sub-agent, always state the strategic reasoning. Why does this matter for the business? What's the angle?
2. PROACTIVE — Don't just answer questions. Identify what Ismail hasn't asked yet but should be thinking about. Bring your own ideas. Spot risks. Find opportunities.
3. DEVELOP IDEAS — When Ismail shares an idea, don't just acknowledge it. Build on it. Add dimensions he hasn't considered. Stress-test it. Make it better.
4. DECISIVENESS — Give clear recommendations, not wishy-washy options. You're the CEO — have a point of view.
5. BREVITY WITH DEPTH — Be concise in your message but pack it with insight. No fluff. No corporate speak. You're a car guy running a business.

ROUTING RULES:
- Route to OPS: anything physical — bays, tools, safety, suppliers, facility setup
- Route to MARKETING: content, campaigns, social media, brand awareness, launch events
- Route to CRM: customer comms, booking issues, follow-ups, WhatsApp messages, multilingual
- Route to DEV: bugs, platform issues, integrations, env vars, technical backlog, "what's broken"
- Route to null: strategy, ideas, planning, analysis — handle yourself

PERMISSION RULES — Always request Ismail's approval before:
- Any customer-facing communication
- Any public post or announcement
- Any financial commitment
- Any external partnership or commitment
- Any real-world action with irreversible consequences
Internal strategy and planning: proceed autonomously.

PROACTIVE INTELLIGENCE — In every response, try to include at least one thing Ismail didn't ask for: a risk he should know about, an opportunity he's missing, a competitor move, a market insight, or a strategic question worth thinking about.

RESPONSE FORMAT — Always respond with valid JSON:
{
  "message": "Your response — strategic, direct, CEO-level. Minimum 2-3 sentences. Show your thinking.",
  "route_to": null | "ops" | "marketing" | "crm" | "dev",
  "agent_payload": { ... } | null,
  "needs_permission": boolean,
  "permission_request": {
    "action": "snake_case_action_id",
    "description": "Exactly what will happen if approved",
    "payload": { "key": "value" }
  } | null,
  "recommendations": [
    {
      "title": "Short title (under 60 chars)",
      "body": "Specific, actionable, with reasoning. What to do and why.",
      "action_type": "review | approve | contact | update | launch | investigate",
      "priority": "critical | high | medium | low"
    }
  ],
  "checklist_updates": [
    { "title": "Exact checklist item title", "is_completed": true }
  ]
}

TONE: Confident, direct, car-culture-fluent. Think a cross between a sharp startup CEO and a petrolhead who knows the UAE market inside out. Never sycophantic. Never vague. Always actionable.`;

export interface CommanderInput {
  messages: Anthropic.MessageParam[];
  userId?: string;
  sessionId?: string;
  stream?: boolean;
  onChunk?: (text: string) => void;
}

export async function runCommanderAgent(
  input: CommanderInput
): Promise<CommanderResponse & { raw: string }> {
  const { messages, userId, sessionId, stream, onChunk } = input;

  let raw: string;

  if (stream && onChunk) {
    const result = await callClaudeStream(
      {
        agent: "commander",
        system: COMMANDER_SYSTEM,
        messages,
        userId,
        sessionId,
        maxTokens: 4096,
      },
      onChunk
    );
    raw = result.content;
  } else {
    const result = await callClaude({
      agent: "commander",
      system: COMMANDER_SYSTEM,
      messages,
      userId,
      sessionId,
      maxTokens: 4096,
    });
    raw = result.content;
  }

  let parsed: CommanderResponse;
  try {
    parsed = parseClaudeJSON<CommanderResponse>(raw);
  } catch {
    parsed = {
      message: raw,
      route_to: null,
      agent_payload: null,
      needs_permission: false,
      permission_request: null,
      recommendations: [],
      checklist_updates: [],
    };
  }

  // Process side effects asynchronously
  processCommanderSideEffects(parsed, userId).catch(console.error);

  return { ...parsed, raw };
}

async function processCommanderSideEffects(
  response: CommanderResponse,
  userId?: string
) {
  const supabaseAdmin = getSupabaseAdmin();

  // Save permission request
  if (response.needs_permission && response.permission_request) {
    const { data: permission } = await supabaseAdmin
      .from("pending_permissions")
      .insert({
        agent: "commander",
        action: response.permission_request.action,
        description: response.permission_request.description,
        payload: response.permission_request.payload,
      })
      .select()
      .single();

    if (permission) {
      await supabaseAdmin.from("events").insert({
        event_type: "permission_requested",
        title: `Commander requesting: ${response.permission_request.action}`,
        body: response.permission_request.description,
        entity_type: "permission",
        entity_id: permission.id,
      });
    }
  }

  // Save recommendations
  if (response.recommendations?.length > 0) {
    await supabaseAdmin.from("recommendations").insert(
      response.recommendations.map((rec: RecommendationInput) => ({
        agent: "commander",
        title: rec.title,
        body: rec.body,
        action_type: rec.action_type ?? null,
        action_payload: rec.action_payload ?? {},
        priority: rec.priority,
      }))
    );
  }

  // Process checklist updates
  if (response.checklist_updates?.length > 0) {
    for (const update of response.checklist_updates as ChecklistUpdate[]) {
      await supabaseAdmin
        .from("launch_checklist")
        .update({
          is_completed: update.is_completed,
          completed_at: update.is_completed ? new Date().toISOString() : null,
          completed_by: userId ?? null,
        })
        .ilike("title", `%${update.title}%`);
    }
  }

  // Log activity event
  await supabaseAdmin.from("events").insert({
    event_type: "commander_response",
    title: "Commander responded",
    body: response.message.slice(0, 200),
    entity_type: "agent",
  });
}
