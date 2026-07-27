-- Contract Administration Manager — Supabase Schema
-- Run this in your Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  role          TEXT NOT NULL DEFAULT 'admin'
                  CHECK (role IN ('superadmin','admin','user')),
  department    TEXT CHECK (department IN (
                  'Civil','MEP','Architecture','Commercial','Legal',
                  'Procurement','Finance','Management')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CONTRACTS
-- ============================================================
CREATE TABLE contracts (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by                UUID REFERENCES users(id),
  title                     TEXT NOT NULL,
  contract_number           TEXT,
  contract_type             TEXT NOT NULL DEFAULT 'FIDIC_RED'
                              CHECK (contract_type IN (
                                'FIDIC_RED','FIDIC_YELLOW','FIDIC_SILVER',
                                'FIDIC_GREEN','NEC3','NEC4','BESPOKE')),
  project_name              TEXT,
  project_location          TEXT,
  contract_value            NUMERIC(15,2),
  currency                  TEXT NOT NULL DEFAULT 'AED',
  retention_percentage      NUMERIC(5,2) DEFAULT 5.00,
  commencement_date         DATE,
  original_completion_date  DATE,
  current_completion_date   DATE,
  defects_liability_end     DATE,
  defects_liability_months  INTEGER DEFAULT 12,
  governing_law             TEXT DEFAULT 'UAE',
  arbitration_body          TEXT CHECK (arbitration_body IN ('DIAC','DIFC_LCIA','ICC','ADCCAC','COURT')),
  arbitration_seat          TEXT DEFAULT 'Dubai',
  storage_path              TEXT,
  file_name                 TEXT,
  file_size_bytes           BIGINT,
  parse_status              TEXT NOT NULL DEFAULT 'pending'
                              CHECK (parse_status IN ('pending','processing','completed','failed')),
  parsed_at                 TIMESTAMPTZ,
  parse_error               TEXT,
  status                    TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','completed','disputed','terminated','suspended')),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- CONTRACT PARTIES
-- ============================================================
CREATE TABLE contract_parties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN (
                    'employer','contractor','engineer','project_manager',
                    'subcontractor','supplier','surety','adjudicator')),
  name            TEXT NOT NULL,
  trade_license   TEXT,
  address         TEXT,
  contact_emails  TEXT[] DEFAULT '{}',
  contact_phones  TEXT[] DEFAULT '{}',
  contact_person  TEXT,
  is_our_org      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contract_parties_contract ON contract_parties(contract_id);

-- ============================================================
-- CONTRACT DEPARTMENTS
-- ============================================================
CREATE TABLE contract_departments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id           UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  department            TEXT NOT NULL CHECK (department IN (
                          'Civil','MEP','Architecture','Commercial',
                          'Legal','Procurement','Finance','Management')),
  responsible_user_id   UUID REFERENCES users(id),
  responsible_name      TEXT,
  responsible_email     TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, department)
);

-- ============================================================
-- CONTRACT CLAUSES
-- ============================================================
CREATE TABLE contract_clauses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id           UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  clause_number         TEXT,
  clause_title          TEXT,
  clause_type           TEXT NOT NULL CHECK (clause_type IN (
                          'notice_period','time_bar','eot_procedure',
                          'variation_procedure','payment_terms','payment_certificate',
                          'defects_liability','performance_bond','retention',
                          'dispute_resolution','termination','suspension',
                          'force_majeure','indemnity','insurance','other')),
  full_text             TEXT,
  summary               TEXT,
  notice_days           INTEGER,
  time_bar_days         INTEGER,
  response_days         INTEGER,
  payment_days          INTEGER,
  department_relevance  TEXT[] DEFAULT '{}',
  fidic_reference       TEXT,
  uae_law_reference     TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contract_clauses_contract ON contract_clauses(contract_id);
CREATE INDEX idx_contract_clauses_type ON contract_clauses(clause_type);

-- ============================================================
-- CONTRACT MILESTONES
-- ============================================================
CREATE TABLE contract_milestones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id       UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  milestone_type    TEXT NOT NULL CHECK (milestone_type IN (
                      'commencement','sectional_completion','practical_completion',
                      'defects_liability_end','notice_deadline','payment_due',
                      'bond_expiry','insurance_renewal','eot_submission',
                      'variation_valuation','arbitration_deadline','other')),
  title             TEXT NOT NULL,
  description       TEXT,
  due_date          DATE NOT NULL,
  linked_clause     TEXT,
  status            TEXT NOT NULL DEFAULT 'upcoming'
                      CHECK (status IN ('upcoming','at_risk','overdue','completed','dismissed')),
  completed_at      TIMESTAMPTZ,
  is_auto_generated BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX idx_milestones_due ON contract_milestones(due_date);
CREATE TRIGGER milestones_updated_at BEFORE UPDATE ON contract_milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- EMAIL ACCOUNTS
-- ============================================================
CREATE TABLE email_accounts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider              TEXT NOT NULL CHECK (provider IN ('gmail','imap')),
  email_address         TEXT NOT NULL,
  display_name          TEXT,
  gmail_access_token    TEXT,
  gmail_refresh_token   TEXT,
  gmail_token_expiry    TIMESTAMPTZ,
  gmail_history_id      TEXT,
  last_synced_at        TIMESTAMPTZ,
  sync_error            TEXT,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email_address)
);

-- ============================================================
-- WHATSAPP CONTACTS
-- ============================================================
CREATE TABLE whatsapp_contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number    TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  party_id        UUID REFERENCES contract_parties(id),
  contract_ids    UUID[] DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CORRESPONDENCE
-- ============================================================
CREATE TABLE correspondence (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id                 UUID REFERENCES contracts(id) ON DELETE SET NULL,
  channel                     TEXT NOT NULL CHECK (channel IN ('email','whatsapp','manual')),
  direction                   TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  email_account_id            UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
  external_id                 TEXT,
  thread_id                   TEXT,
  subject                     TEXT,
  body_text                   TEXT,
  body_html                   TEXT,
  sender_name                 TEXT,
  sender_contact              TEXT,
  recipient_contacts          TEXT[] DEFAULT '{}',
  cc_contacts                 TEXT[] DEFAULT '{}',
  received_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analysis_status             TEXT NOT NULL DEFAULT 'pending'
                                CHECK (analysis_status IN ('pending','processing','completed','failed','skipped')),
  analyzed_at                 TIMESTAMPTZ,
  analysis_error              TEXT,
  correspondence_type         TEXT CHECK (correspondence_type IN (
                                'eot_claim','variation_claim','variation_instruction',
                                'payment_application','payment_certificate',
                                'defect_notice','notice_of_dissatisfaction',
                                'notice_of_claim','site_instruction','rfi',
                                'noc_request','contractual_notice','dispute_notice',
                                'general_correspondence','meeting_minutes',
                                'programme_update','site_report','other')),
  department                  TEXT CHECK (department IN (
                                'Civil','MEP','Architecture','Commercial',
                                'Legal','Procurement','Finance','Management','Multiple')),
  requires_response           BOOLEAN,
  response_deadline           TIMESTAMPTZ,
  risk_level                  TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  ai_summary                  TEXT,
  contract_match_confidence   NUMERIC(3,2),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_correspondence_contract ON correspondence(contract_id);
CREATE INDEX idx_correspondence_channel ON correspondence(channel);
CREATE INDEX idx_correspondence_received ON correspondence(received_at DESC);
CREATE INDEX idx_correspondence_risk ON correspondence(risk_level);
CREATE INDEX idx_correspondence_status ON correspondence(analysis_status);
CREATE INDEX idx_correspondence_thread ON correspondence(thread_id);
CREATE TRIGGER correspondence_updated_at BEFORE UPDATE ON correspondence
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- CORRESPONDENCE ATTACHMENTS
-- ============================================================
CREATE TABLE correspondence_attachments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  correspondence_id   UUID NOT NULL REFERENCES correspondence(id) ON DELETE CASCADE,
  filename            TEXT NOT NULL,
  storage_path        TEXT NOT NULL,
  mime_type           TEXT,
  size_bytes          BIGINT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_attachments_correspondence ON correspondence_attachments(correspondence_id);

-- ============================================================
-- ACTIONS
-- ============================================================
CREATE TABLE actions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id         UUID REFERENCES contracts(id) ON DELETE CASCADE,
  correspondence_id   UUID REFERENCES correspondence(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  action_type         TEXT NOT NULL CHECK (action_type IN (
                        'serve_notice','submit_claim','submit_eot',
                        'respond_to_claim','respond_to_instruction',
                        'issue_payment_certificate','review_variation',
                        'internal_review','legal_review','escalate',
                        'file_document','update_programme','other')),
  department          TEXT CHECK (department IN (
                        'Civil','MEP','Architecture','Commercial',
                        'Legal','Procurement','Finance','Management')),
  assignee_user_id    UUID REFERENCES users(id),
  assignee_email      TEXT,
  due_date            TIMESTAMPTZ,
  is_hard_deadline    BOOLEAN DEFAULT FALSE,
  linked_clause       TEXT,
  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('critical','high','medium','low')),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed','overdue','dismissed')),
  completed_at        TIMESTAMPTZ,
  completed_by        UUID REFERENCES users(id),
  completion_note     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_actions_contract ON actions(contract_id);
CREATE INDEX idx_actions_status ON actions(status);
CREATE INDEX idx_actions_due ON actions(due_date);
CREATE INDEX idx_actions_priority ON actions(priority);
CREATE TRIGGER actions_updated_at BEFORE UPDATE ON actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- LEGAL FLAGS
-- ============================================================
CREATE TABLE legal_flags (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id             UUID REFERENCES contracts(id) ON DELETE CASCADE,
  correspondence_id       UUID REFERENCES correspondence(id) ON DELETE CASCADE,
  flag_type               TEXT NOT NULL CHECK (flag_type IN (
                            'time_bar_risk','payment_overdue','eot_not_claimed',
                            'notice_not_served','variation_not_valued',
                            'defect_not_notified','bond_expiry_risk',
                            'programme_not_submitted','rfi_overdue',
                            'dispute_risk','termination_risk','other')),
  severity                TEXT NOT NULL CHECK (severity IN ('info','warning','high','critical')),
  title                   TEXT NOT NULL,
  description             TEXT,
  current_risk_narrative  TEXT,
  future_risk_narrative   TEXT,
  uae_law_references      TEXT[] DEFAULT '{}',
  fidic_clause_refs       TEXT[] DEFAULT '{}',
  action_deadline         TIMESTAMPTZ,
  recommended_action      TEXT,
  recommended_response_type TEXT,
  is_resolved             BOOLEAN DEFAULT FALSE,
  resolved_at             TIMESTAMPTZ,
  resolved_by             UUID REFERENCES users(id),
  resolution_note         TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_legal_flags_contract ON legal_flags(contract_id);
CREATE INDEX idx_legal_flags_severity ON legal_flags(severity);
CREATE INDEX idx_legal_flags_resolved ON legal_flags(is_resolved);
CREATE TRIGGER legal_flags_updated_at BEFORE UPDATE ON legal_flags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- DRAFT RESPONSES
-- ============================================================
CREATE TABLE draft_responses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  correspondence_id     UUID NOT NULL REFERENCES correspondence(id) ON DELETE CASCADE,
  contract_id           UUID REFERENCES contracts(id),
  subject               TEXT,
  draft_content         TEXT NOT NULL,
  response_type         TEXT CHECK (response_type IN (
                          'rejection','acknowledgment','counter_proposal',
                          'information_request','approval','without_prejudice',
                          'reservation_of_rights','notice_response','other')),
  cited_clauses         TEXT[] DEFAULT '{}',
  cited_uae_laws        TEXT[] DEFAULT '{}',
  cited_fidic_clauses   TEXT[] DEFAULT '{}',
  tone                  TEXT CHECK (tone IN ('formal','firm','conciliatory','neutral')),
  language              TEXT DEFAULT 'en' CHECK (language IN ('en','ar','en_ar')),
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','revised','approved','sent','dismissed')),
  revision_count        INTEGER DEFAULT 0,
  revision_notes        TEXT,
  approved_by           UUID REFERENCES users(id),
  approved_at           TIMESTAMPTZ,
  sent_at               TIMESTAMPTZ,
  sent_by               UUID REFERENCES users(id),
  sent_via              TEXT CHECK (sent_via IN ('email','whatsapp','manual')),
  sent_message_id       TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_draft_responses_correspondence ON draft_responses(correspondence_id);
CREATE INDEX idx_draft_responses_status ON draft_responses(status);
CREATE TRIGGER draft_responses_updated_at BEFORE UPDATE ON draft_responses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- AGENT LOGS
-- ============================================================
CREATE TABLE agent_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type      TEXT NOT NULL CHECK (agent_type IN (
                    'orchestrator','contract_parser','correspondence_analyst',
                    'legal_risk_assessor','response_drafter')),
  entity_type     TEXT CHECK (entity_type IN ('contract','correspondence')),
  entity_id       UUID,
  user_id         UUID REFERENCES users(id),
  status          TEXT NOT NULL CHECK (status IN ('started','completed','failed')),
  model           TEXT NOT NULL,
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  duration_ms     INTEGER,
  error_message   TEXT,
  prompt_summary  TEXT,
  response_summary TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_logs_entity ON agent_logs(entity_type, entity_id);
CREATE INDEX idx_agent_logs_agent ON agent_logs(agent_type);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_admin_all" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contracts_read" ON contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contracts_write" ON contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE contract_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contract_parties_read" ON contract_parties FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contract_parties_write" ON contract_parties FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE contract_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contract_departments_read" ON contract_departments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contract_departments_write" ON contract_departments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE contract_clauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contract_clauses_read" ON contract_clauses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contract_clauses_write" ON contract_clauses FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE contract_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_read" ON contract_milestones FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "milestones_write" ON contract_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_accounts_own" ON email_accounts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_contacts_read" ON whatsapp_contacts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "whatsapp_contacts_write" ON whatsapp_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE correspondence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "correspondence_read" ON correspondence FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "correspondence_write" ON correspondence FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE correspondence_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_read" ON correspondence_attachments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "attachments_write" ON correspondence_attachments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_read" ON actions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "actions_write" ON actions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE legal_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_flags_read" ON legal_flags FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "legal_flags_write" ON legal_flags FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE draft_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drafts_read" ON draft_responses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "drafts_write" ON draft_responses FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','superadmin')));

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_logs_read" ON agent_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "agent_logs_write" ON agent_logs FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE correspondence;
ALTER PUBLICATION supabase_realtime ADD TABLE actions;
ALTER PUBLICATION supabase_realtime ADD TABLE legal_flags;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE contract_milestones;
