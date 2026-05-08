export type AgentName = "commander" | "ops" | "marketing" | "crm" | "dev";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  agent?: AgentName;
  timestamp: Date;
}

export interface CommanderResponse {
  message: string;
  route_to: "ops" | "marketing" | "crm" | "dev" | null;
  agent_payload: Record<string, unknown> | null;
  needs_permission: boolean;
  permission_request: PermissionRequest | null;
  recommendations: RecommendationInput[];
  checklist_updates: ChecklistUpdate[];
}

export interface PermissionRequest {
  action: string;
  description: string;
  payload: Record<string, unknown>;
}

export interface Permission {
  id: string;
  agent: AgentName;
  action: string;
  description: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
}

export interface RecommendationInput {
  title: string;
  body: string;
  action_type?: string;
  action_payload?: Record<string, unknown>;
  priority: "critical" | "high" | "medium" | "low";
}

export interface Recommendation extends RecommendationInput {
  id: string;
  agent: AgentName;
  is_dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
}

export interface ChecklistUpdate {
  title: string;
  is_completed: boolean;
}

export interface LaunchChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  priority: number;
  notes: string | null;
  created_at: string;
}

export interface AgentStatus {
  name: AgentName;
  label: string;
  color: string;
  status: "active" | "standby" | "processing" | "error";
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
