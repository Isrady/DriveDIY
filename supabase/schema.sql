-- DriveDIY Database Schema
-- Run this in the Supabase SQL editor for your project

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'mechanic')),
  subscription_tier TEXT DEFAULT 'drop_in' CHECK (subscription_tier IN ('drop_in', 'builder', 'gearhead')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar', 'ur', 'tl')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  trim TEXT,
  vin TEXT,
  color TEXT,
  mileage INTEGER,
  build_notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS bays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  bay_type TEXT DEFAULT 'standard' CHECK (bay_type IN ('standard', 'lift', 'detail')),
  lift_capacity_kg INTEGER,
  hourly_rate_aed DECIMAL(10,2) NOT NULL DEFAULT 85.00,
  is_active BOOLEAN DEFAULT true,
  amenities JSONB DEFAULT '[]',
  google_calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed 5 bays
INSERT INTO bays (name, description, bay_type, lift_capacity_kg, hourly_rate_aed, amenities) VALUES
  ('Bay 1', 'Standard ground-level bay with full equipment access', 'standard', NULL, 85.00, '["compressed_air", "lighting", "workbench"]'),
  ('Bay 2', 'Standard ground-level bay with workbench', 'standard', NULL, 85.00, '["compressed_air", "lighting", "workbench"]'),
  ('Bay 3', '2-post hydraulic lift bay — up to 3,500 kg', 'lift', 3500, 85.00, '["2_post_lift", "compressed_air", "lighting"]'),
  ('Bay 4', '4-post hydraulic lift bay — up to 5,000 kg', 'lift', 5000, 85.00, '["4_post_lift", "compressed_air", "lighting", "workbench"]'),
  ('Bay 5', 'Detail and inspection bay with drain', 'detail', NULL, 85.00, '["drain", "lighting", "water_access", "compressed_air"]')
ON CONFLICT DO NOTHING;

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  bay_id UUID NOT NULL REFERENCES bays(id) ON DELETE RESTRICT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show')),
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  total_aed DECIMAL(10,2) NOT NULL,
  notes TEXT,
  google_event_id TEXT,
  checked_in_at TIMESTAMPTZ,
  checked_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TOOLS
-- ============================================================
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  model_number TEXT,
  daily_rate_aed DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'needs_service')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed tool inventory
INSERT INTO tools (name, description, category, daily_rate_aed) VALUES
  ('Torque Wrench Kit', 'Professional torque wrench set 20-200 Nm', 'hand_tools', 0),
  ('OBD2 Scanner', 'Professional diagnostic scanner — all protocols', 'diagnostic', 0),
  ('Oil Extractor Pump', 'Pneumatic oil extraction pump 12L', 'fluid_tools', 0),
  ('Brake Bleeder Kit', 'Vacuum brake bleeder with pressure gauge', 'brake_tools', 0),
  ('Impact Wrench', '1/2" drive pneumatic impact wrench', 'power_tools', 0),
  ('Jack Stand Set', 'Heavy duty 3-ton jack stands (pair)', 'lifting', 0),
  ('Bearing Puller', 'Universal bearing puller set', 'hand_tools', 0),
  ('Compression Tester', 'Engine compression test kit', 'diagnostic', 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- TOOL RENTALS
-- ============================================================
CREATE TABLE IF NOT EXISTS tool_rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id),
  rented_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  condition_out TEXT,
  condition_in TEXT,
  notes TEXT
);

-- ============================================================
-- PARTS
-- ============================================================
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  part_number TEXT,
  price_aed DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 5,
  compatible_makes TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'fulfilled', 'cancelled')),
  total_aed DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS (enriched CRM data)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  lifetime_value_aed DECIMAL(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  acquisition_channel TEXT,
  nationality TEXT,
  car_interests TEXT[],
  preferred_contact TEXT DEFAULT 'whatsapp' CHECK (preferred_contact IN ('whatsapp', 'email', 'sms')),
  whatsapp_number TEXT,
  notes TEXT,
  tags TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGENT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  latency_ms INTEGER,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PENDING PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_note TEXT
);

-- ============================================================
-- EVENTS (activity feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LAUNCH CHECKLIST
-- ============================================================
CREATE TABLE IF NOT EXISTS launch_checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  priority INTEGER DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed launch checklist
INSERT INTO launch_checklist (category, title, description, priority) VALUES
  -- Legal
  ('legal', 'UAE Trade License', 'Apply for trade license from DED (Dubai Economy & Tourism). DED Al Quoz branch recommended.', 1),
  ('legal', 'Business Registration (Mainland or Freezone)', 'Register business entity — mainland DED or Al Quoz Industrial Freezone (KIZAD/JAFZA). Mainland recommended for walk-in customers.', 1),
  ('legal', 'Automotive Workshop Permit', 'Obtain automotive workshop operating permit from Dubai Municipality.', 1),
  ('legal', 'Civil Defense Approval', 'Fire safety compliance and Civil Defense approval for workshop with hydraulic equipment.', 1),
  ('legal', 'Commercial Insurance', 'Business liability insurance covering customer vehicles, equipment, and premises.', 2),
  ('legal', 'Emirates ID for Owner', 'Ensure Ismail has valid Emirates ID for all business registrations.', 1),

  -- Facility
  ('facility', 'Lease Al Quoz Workshop Space', 'Minimum 500 sqm in Al Quoz Industrial 1, 2, or 3. Budget AED 80,000-120,000/year. Near Sheikh Zayed Road for accessibility.', 1),
  ('facility', 'Facility Fitout', 'Concrete floor sealing, drainage channels, electrical 3-phase power, compressed air lines, lighting installation.', 1),
  ('facility', '2-Post Hydraulic Lift (x2)', 'Purchase and install two 2-post lifts (3,500kg capacity). Supplier: Rotary Lift, Bendpak or local: Gulf Technical Equipment.', 1),
  ('facility', '4-Post Hydraulic Lift (x1)', 'Purchase and install one 4-post lift (5,000kg). Ideal for alignment and storage.', 1),
  ('facility', 'Air Compressor System', 'Industrial rotary screw compressor (minimum 25HP) with air lines to all bays.', 2),
  ('facility', 'Tool Storage & Organization', 'Tool cabinets, pegboards, shadow boards for each bay. Barcode all tools for tracking.', 2),
  ('facility', 'Reception / Front Desk Setup', 'Customer check-in area, TV screen for bay status, seating.', 3),
  ('facility', 'CCTV & Security', '12-camera CCTV system covering all bays, entrance, tool storage.', 2),
  ('facility', 'Signage & Branding', 'Exterior fascia sign, bay number signs, safety signs, floor markings in DriveDIY brand colors.', 3),

  -- Equipment & Inventory
  ('equipment', 'Initial Tool Kit Inventory', 'Purchase tool sets for 5 bays: torque wrenches, socket sets, jacks, stands. Budget AED 25,000.', 1),
  ('equipment', 'Diagnostic Equipment', '3x professional OBD2 scanners (Launch X431 or Autel). Budget AED 15,000.', 2),
  ('equipment', 'Parts Initial Stock', 'Source common consumables: oil filters, drain plugs, brake pads (top 20 SKUs for Dubai market).', 2),
  ('equipment', 'Parts Supplier Agreements', 'Negotiate accounts with: Al Futtaim Auto Parts, ACDelco UAE, Arab Parts, Lucky Auto Parts (Al Quoz).', 1),

  -- Staffing
  ('staffing', 'Hire Facility Manager', 'Operations manager for day-to-day facility. Experience in automotive workshop management in UAE.', 1),
  ('staffing', 'Hire 2x Mechanic Assistants', 'On-call mechanics for Mechanic Assist service (AED 120/hr). UAE driving license required.', 2),
  ('staffing', 'Hire Front Desk / Booking Agent', 'Customer-facing role handling walk-ins, calls, WhatsApp inquiries. Arabic + English required.', 2),

  -- Tech & Payments
  ('tech', 'Domain & Hosting', 'Register drivediy.ae (Namecheap/GoDaddy UAE). Deploy platform to Vercel.', 1),
  ('tech', 'Supabase Project Setup', 'Create Supabase project, run schema.sql, configure Google OAuth.', 1),
  ('tech', 'Stripe Account Setup', 'Create Stripe account with UAE bank (Emirates NBD or Mashreq). Enable AED currency. Create price IDs for Builder and Gearhead.', 1),
  ('tech', 'Twilio WhatsApp Business', 'Upgrade from sandbox to production WhatsApp number. Submit business verification.', 1),
  ('tech', 'Google Calendar Setup', 'Create 5 calendars (one per bay). Create service account for API access.', 1),
  ('tech', 'Resend Domain Verification', 'Add Resend DNS records to drivediy.ae for email deliverability.', 1),
  ('tech', 'Anthropic API Key', 'Get production Anthropic API key and set usage limits.', 1),

  -- Marketing
  ('marketing', 'Instagram Account', 'Create @drivediy.ae — profile photo (logo), bio in EN+AR, highlights setup.', 1),
  ('marketing', 'TikTok Account', 'Create @drivediy.ae TikTok — target UAE car community.', 2),
  ('marketing', 'WhatsApp Business Account', 'Set up WhatsApp Business profile with catalog, greeting message, away message.', 1),
  ('marketing', 'Snapchat Presence', 'Create Snapchat account for UAE youth audience (major platform in UAE).', 2),
  ('marketing', 'Google Business Profile', 'Register on Google Maps as automotive service. Critical for Al Quoz discovery.', 1),
  ('marketing', 'Pre-Launch Waitlist', 'Run Instagram + TikTok ads driving to waitlist. Target: car clubs, GTI UAE, JDM UAE groups.', 2),
  ('marketing', 'Launch Event Planning', 'Plan grand opening car meet: free first bay hour, live music, social content. Target 200+ attendees.', 2),
  ('marketing', 'Content Creator Partnerships', 'Brief 3-5 UAE automotive creators for launch coverage. Budget AED 10,000.', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent TEXT NOT NULL DEFAULT 'commander',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_type TEXT,
  action_payload JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial Commander recommendations
INSERT INTO recommendations (agent, title, body, priority) VALUES
  ('commander', 'Complete UAE Trade License First', 'The trade license is the foundation for everything else. Without it, you cannot open a bank account, sign a lease, or hire staff. Start with DED (Dubai Economy) at Al Quoz branch. Takes 2-4 weeks.', 'critical'),
  ('commander', 'Secure Al Quoz Warehouse Space', 'Al Quoz Industrial 1 and 2 have ideal units for automotive workshops (high ceiling, 3-phase power, loading access). Start with Dubizzle Commercial and local agents. Budget AED 100K/year for 500+ sqm.', 'critical'),
  ('commander', 'Set Up Stripe Account Now', 'Stripe requires UAE bank account (which requires trade license). The sooner you start the banking process, the sooner you can take payments. Emirates NBD Business or Mashreq Neo Business recommended.', 'high'),
  ('commander', 'Join UAE Car Community Groups', 'Before launch, establish presence in: GTI Owners UAE (Facebook), JDM UAE (Instagram), Dubai Car Meets, Modified Cars UAE. This is your primary customer acquisition channel.', 'high')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- VEHICLES
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select_own" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vehicles_insert_own" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehicles_update_own" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vehicles_delete_own" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- BAYS (public read)
ALTER TABLE bays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bays_select_all" ON bays FOR SELECT USING (true);
CREATE POLICY "bays_modify_admin" ON bays FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- BOOKINGS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update_own" ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookings_admin_all" ON bookings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- TOOLS (public read)
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tools_select_all" ON tools FOR SELECT USING (true);
CREATE POLICY "tools_modify_admin" ON tools FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- TOOL_RENTALS
ALTER TABLE tool_rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tool_rentals_own" ON tool_rentals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tool_rentals_insert_own" ON tool_rentals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PARTS (public read)
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parts_select_all" ON parts FOR SELECT USING (true);
CREATE POLICY "parts_modify_admin" ON parts FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ORDERS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_all" ON orders FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- CUSTOMERS (admin only)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_admin_all" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- AGENT_LOGS (admin only)
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_logs_admin_all" ON agent_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- PENDING_PERMISSIONS (admin only)
ALTER TABLE pending_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions_admin_all" ON pending_permissions FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- EVENTS (admin only)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_admin_all" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- LAUNCH_CHECKLIST (admin only)
ALTER TABLE launch_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_admin_all" ON launch_checklist FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- RECOMMENDATIONS (admin only)
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recommendations_admin_all" ON recommendations FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_permissions;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations;
