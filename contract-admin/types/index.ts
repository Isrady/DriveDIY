export type UserRole = "superadmin" | "admin" | "user";
export type Department =
  | "Civil"
  | "MEP"
  | "Architecture"
  | "Commercial"
  | "Legal"
  | "Procurement"
  | "Finance"
  | "Management";

export type ContractType =
  | "FIDIC_RED"
  | "FIDIC_YELLOW"
  | "FIDIC_SILVER"
  | "FIDIC_GREEN"
  | "NEC3"
  | "NEC4"
  | "BESPOKE";

export type ContractStatus =
  | "active"
  | "completed"
  | "disputed"
  | "terminated"
  | "suspended";

export type ParseStatus = "pending" | "processing" | "completed" | "failed";

export type ClauseType =
  | "notice_period"
  | "time_bar"
  | "eot_procedure"
  | "variation_procedure"
  | "payment_terms"
  | "payment_certificate"
  | "defects_liability"
  | "performance_bond"
  | "retention"
  | "dispute_resolution"
  | "termination"
  | "suspension"
  | "force_majeure"
  | "indemnity"
  | "insurance"
  | "other";

export type MilestoneType =
  | "commencement"
  | "sectional_completion"
  | "practical_completion"
  | "defects_liability_end"
  | "notice_deadline"
  | "payment_due"
  | "bond_expiry"
  | "insurance_renewal"
  | "eot_submission"
  | "variation_valuation"
  | "arbitration_deadline"
  | "other";

export type MilestoneStatus =
  | "upcoming"
  | "at_risk"
  | "overdue"
  | "completed"
  | "dismissed";

export type CorrespondenceChannel = "email" | "whatsapp" | "manual";
export type CorrespondenceDirection = "inbound" | "outbound";
export type AnalysisStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type CorrespondenceType =
  | "eot_claim"
  | "variation_claim"
  | "variation_instruction"
  | "payment_application"
  | "payment_certificate"
  | "defect_notice"
  | "notice_of_dissatisfaction"
  | "notice_of_claim"
  | "site_instruction"
  | "rfi"
  | "noc_request"
  | "contractual_notice"
  | "dispute_notice"
  | "general_correspondence"
  | "meeting_minutes"
  | "programme_update"
  | "site_report"
  | "other";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ActionType =
  | "serve_notice"
  | "submit_claim"
  | "submit_eot"
  | "respond_to_claim"
  | "respond_to_instruction"
  | "issue_payment_certificate"
  | "review_variation"
  | "internal_review"
  | "legal_review"
  | "escalate"
  | "file_document"
  | "update_programme"
  | "other";

export type ActionPriority = "critical" | "high" | "medium" | "low";
export type ActionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "overdue"
  | "dismissed";

export type FlagType =
  | "time_bar_risk"
  | "payment_overdue"
  | "eot_not_claimed"
  | "notice_not_served"
  | "variation_not_valued"
  | "defect_not_notified"
  | "bond_expiry_risk"
  | "programme_not_submitted"
  | "rfi_overdue"
  | "dispute_risk"
  | "termination_risk"
  | "other";

export type FlagSeverity = "info" | "warning" | "high" | "critical";

export type DraftStatus =
  | "draft"
  | "revised"
  | "approved"
  | "sent"
  | "dismissed";
export type DraftTone = "formal" | "firm" | "conciliatory" | "neutral";

export type AgentType =
  | "orchestrator"
  | "contract_parser"
  | "correspondence_analyst"
  | "legal_risk_assessor"
  | "response_drafter";

// ============================================================
// DB Row Types
// ============================================================

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  department: Department | null;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  created_by: string | null;
  title: string;
  contract_number: string | null;
  contract_type: ContractType;
  project_name: string | null;
  project_location: string | null;
  contract_value: number | null;
  currency: string;
  retention_percentage: number;
  commencement_date: string | null;
  original_completion_date: string | null;
  current_completion_date: string | null;
  defects_liability_end: string | null;
  defects_liability_months: number;
  governing_law: string;
  arbitration_body: string | null;
  arbitration_seat: string;
  storage_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  parse_status: ParseStatus;
  parsed_at: string | null;
  parse_error: string | null;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
}

export interface ContractParty {
  id: string;
  contract_id: string;
  role: string;
  name: string;
  trade_license: string | null;
  address: string | null;
  contact_emails: string[];
  contact_phones: string[];
  contact_person: string | null;
  is_our_org: boolean;
  created_at: string;
}

export interface ContractDepartment {
  id: string;
  contract_id: string;
  department: Department;
  responsible_user_id: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  notes: string | null;
  created_at: string;
}

export interface ContractClause {
  id: string;
  contract_id: string;
  clause_number: string | null;
  clause_title: string | null;
  clause_type: ClauseType;
  full_text: string | null;
  summary: string | null;
  notice_days: number | null;
  time_bar_days: number | null;
  response_days: number | null;
  payment_days: number | null;
  department_relevance: string[];
  fidic_reference: string | null;
  uae_law_reference: string | null;
  created_at: string;
}

export interface ContractMilestone {
  id: string;
  contract_id: string;
  milestone_type: MilestoneType;
  title: string;
  description: string | null;
  due_date: string;
  linked_clause: string | null;
  status: MilestoneStatus;
  completed_at: string | null;
  is_auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailAccount {
  id: string;
  user_id: string;
  provider: "gmail" | "imap";
  email_address: string;
  display_name: string | null;
  gmail_access_token: string | null;
  gmail_refresh_token: string | null;
  gmail_token_expiry: string | null;
  gmail_history_id: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  phone_number: string;
  display_name: string | null;
  party_id: string | null;
  contract_ids: string[];
  notes: string | null;
  created_at: string;
}

export interface Correspondence {
  id: string;
  contract_id: string | null;
  channel: CorrespondenceChannel;
  direction: CorrespondenceDirection;
  email_account_id: string | null;
  external_id: string | null;
  thread_id: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  sender_name: string | null;
  sender_contact: string | null;
  recipient_contacts: string[];
  cc_contacts: string[];
  received_at: string;
  analysis_status: AnalysisStatus;
  analyzed_at: string | null;
  analysis_error: string | null;
  correspondence_type: CorrespondenceType | null;
  department: Department | "Multiple" | null;
  requires_response: boolean | null;
  response_deadline: string | null;
  risk_level: RiskLevel | null;
  ai_summary: string | null;
  contract_match_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface CorrespondenceAttachment {
  id: string;
  correspondence_id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export interface Action {
  id: string;
  contract_id: string | null;
  correspondence_id: string | null;
  title: string;
  description: string | null;
  action_type: ActionType;
  department: Department | null;
  assignee_user_id: string | null;
  assignee_email: string | null;
  due_date: string | null;
  is_hard_deadline: boolean;
  linked_clause: string | null;
  priority: ActionPriority;
  status: ActionStatus;
  completed_at: string | null;
  completed_by: string | null;
  completion_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalFlag {
  id: string;
  contract_id: string | null;
  correspondence_id: string | null;
  flag_type: FlagType;
  severity: FlagSeverity;
  title: string;
  description: string | null;
  current_risk_narrative: string | null;
  future_risk_narrative: string | null;
  uae_law_references: string[];
  fidic_clause_refs: string[];
  action_deadline: string | null;
  recommended_action: string | null;
  recommended_response_type: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DraftResponse {
  id: string;
  correspondence_id: string;
  contract_id: string | null;
  subject: string | null;
  draft_content: string;
  response_type: string | null;
  cited_clauses: string[];
  cited_uae_laws: string[];
  cited_fidic_clauses: string[];
  tone: DraftTone | null;
  language: "en" | "ar" | "en_ar";
  status: DraftStatus;
  revision_count: number;
  revision_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  sent_by: string | null;
  sent_via: "email" | "whatsapp" | "manual" | null;
  sent_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  agent_type: AgentType;
  entity_type: "contract" | "correspondence" | null;
  entity_id: string | null;
  user_id: string | null;
  status: "started" | "completed" | "failed";
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number | null;
  error_message: string | null;
  prompt_summary: string | null;
  response_summary: string | null;
  created_at: string;
}

// ============================================================
// Agent Output Types
// ============================================================

export interface ContractParserOutput {
  contract: {
    title: string;
    contract_number: string;
    contract_type: ContractType;
    project_name: string;
    project_location: string;
    contract_value: number;
    currency: string;
    retention_percentage: number;
    commencement_date: string;
    original_completion_date: string;
    defects_liability_months: number;
    governing_law: string;
    arbitration_body: string;
    arbitration_seat: string;
  };
  parties: Array<{
    role: string;
    name: string;
    trade_license?: string;
    address?: string;
    contact_emails: string[];
    contact_phones: string[];
    contact_person?: string;
  }>;
  clauses: Array<{
    clause_number: string;
    clause_title: string;
    clause_type: ClauseType;
    full_text: string;
    summary: string;
    notice_days?: number;
    time_bar_days?: number;
    response_days?: number;
    payment_days?: number;
    department_relevance: string[];
    fidic_reference?: string;
    uae_law_reference?: string;
  }>;
  milestones: Array<{
    milestone_type: MilestoneType;
    title: string;
    description: string;
    due_date: string;
    linked_clause?: string;
  }>;
  departments: Array<{
    department: Department;
    notes: string;
  }>;
  confidence_score: number;
  parsing_notes: string[];
}

export interface CorrespondenceAnalystOutput {
  contract_id: string | null;
  contract_match_confidence: number;
  contract_match_reasoning: string;
  correspondence_type: CorrespondenceType;
  department: Department | "Multiple";
  department_reasoning: string;
  requires_response: boolean;
  response_deadline: string | null;
  response_deadline_clause: string | null;
  summary: string;
  key_claims: string[];
  contractual_references: string[];
  initial_risk_level: RiskLevel;
  initial_risk_reasoning: string;
  suggested_actions: Array<{
    action_type: ActionType;
    title: string;
    description: string;
    department: Department;
    due_date: string | null;
    is_hard_deadline: boolean;
    priority: ActionPriority;
    linked_clause: string | null;
  }>;
}

export interface LegalRiskFlag {
  flag_type: FlagType;
  severity: FlagSeverity;
  title: string;
  description: string;
  current_risk_narrative: string;
  future_risk_narrative: string;
  uae_law_references: string[];
  fidic_clause_refs: string[];
  action_deadline: string | null;
  recommended_action: string;
  recommended_response_type: string;
}

export interface LegalRiskOutput {
  overall_risk_level: RiskLevel;
  flags: LegalRiskFlag[];
  legal_memo: string;
}

export interface ResponseDrafterOutput {
  subject: string;
  draft_content: string;
  response_type: string;
  tone: DraftTone;
  cited_clauses: string[];
  cited_uae_laws: string[];
  cited_fidic_clauses: string[];
  key_positions_taken: string[];
  reservations: string[];
  drafting_notes: string;
}
