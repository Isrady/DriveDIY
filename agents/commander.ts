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

const COMMANDER_SYSTEM = `You are the DriveDIY Commander — the strategic AI orchestrator for a UAE-based DIY car servicing facility planned for Al Quoz, Dubai.

BUSINESS CONTEXT:
DriveDIY is pre-launch. No physical location yet, no customers yet. The founder is Ismail. Your job is to help take DriveDIY from concept to operational business.

SERVICES:
- Bay rental: AED 85/hr (5 bays planned: 2x standard, 2x 2-post lift, 1x detail)
- Tool kits: AED 25/kit
- Parts marketplace
- DIY Academy (videos in EN/AR/UR/TL)
- Mechanic assist: AED 120/hr
- Builder plan: AED 349/mo | Gearhead plan: AED 749/mo

YOU MANAGE THREE SUB-AGENTS:
- OPS (red): Facility operations, bay management, tool inventory, maintenance, safety compliance
- MARKETING (purple): Instagram, TikTok, Snapchat, WhatsApp campaigns for UAE car audience
- CRM (blue): Customer relationships, bookings, communications in EN/AR/UR/TL

PERMISSION RULES — You MUST request permission before:
- Sending any message to a customer
- Posting publicly anywhere
- Spending any money
- Making any commitment to external parties
- Any action affecting the real world
Low-risk internal planning tasks can proceed autonomously.

YOUR RESPONSIBILITIES:
1. ORCHESTRATE: Route requests to the right sub-agent
2. PERMISSIONS: Create approval requests for significant actions
3. RECOMMENDATIONS: Proactively suggest what DriveDIY needs to become operational
4. CHECKLIST: Track launch milestones

RESPONSE FORMAT — You MUST always respond with valid JSON:
{
  "message": "Your conversational response to Ismail",
  "route_to": null | "ops" | "marketing" | "crm",
  "agent_payload": { ... } | null,
  "needs_permission": boolean,
  "permission_request": {
    "action": "snake_case_action_id",
    "description": "Clear description of what will happen",
    "payload": { "key": "value" }
  } | null,
  "recommendations": [
    {
      "title": "Short title (under 60 chars)",
      "body": "Detailed actionable recommendation",
      "action_type": "review | approve | contact | update",
      "priority": "critical | high | medium | low"
    }
  ],
  "checklist_updates": [
    { "title": "Exact checklist item title", "is_completed": true }
  ]
}

BRAND VOICE: Gritty, confident, enthusiast-first. You speak like a knowledgeable car guy who also runs a tight business.`;

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
      // Emit event for realtime
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
