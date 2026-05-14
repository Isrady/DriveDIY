-- Run this in the Supabase SQL editor AFTER schema.sql

-- ============================================================
-- GUIDES (DIY Academy content)
-- ============================================================
CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  title_ur TEXT,
  title_tl TEXT,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration_text TEXT NOT NULL,
  icon TEXT DEFAULT '🔧',
  tags TEXT[] DEFAULT '{}',
  youtube_id TEXT,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guides_public_read" ON guides FOR SELECT USING (is_published = true);
CREATE POLICY "guides_admin_all" ON guides FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO guides (title_en, title_ar, title_ur, title_tl, level, duration_text, icon, tags, sort_order) VALUES
  ('Oil Change Complete Guide', 'دليل تغيير الزيت الكامل', 'آئل چینج مکمل گائیڈ', 'Kumpletong Gabay sa Pagpapalit ng Langis', 'Beginner', '45 min', '🛢️', ARRAY['engine','maintenance'], 1),
  ('Brake Pad Replacement', 'تبديل أكواب الفرامل', 'بریک پیڈ تبدیلی', 'Pagpapalit ng Brake Pad', 'Beginner', '90 min', '🛞', ARRAY['brakes','safety'], 2),
  ('OBD Diagnostics 101', 'تشخيص OBD للمبتدئين', 'OBD تشخیص بنیادی باتیں', 'OBD Diagnostics Para sa Mga Baguhan', 'Beginner', '30 min', '📱', ARRAY['diagnostic','electronics'], 3),
  ('Suspension Basics', 'أساسيات نظام التعليق', 'سسپنشن کی بنیادی باتیں', 'Mga Pangunahing Kaalaman sa Suspension', 'Intermediate', '2 hr', '🔩', ARRAY['suspension','handling'], 4),
  ('Turbo Install Guide', 'دليل تركيب التوربو', 'ٹربو انسٹال گائیڈ', 'Gabay sa Pag-install ng Turbo', 'Advanced', '4 hr', '💨', ARRAY['performance','engine'], 5),
  ('Wheel Alignment Check', 'فحص ميزان العجلات', 'وھیل الائنمنٹ چیک', 'Pagsusuri ng Wheel Alignment', 'Beginner', '20 min', '⚖️', ARRAY['wheels','handling'], 6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PARTS seed data
-- ============================================================
INSERT INTO parts (name, description, category, brand, part_number, price_aed, stock_quantity, compatible_makes) VALUES
  ('Engine Oil Filter', 'High-flow oil filter for common 4-cylinder engines', 'filters', 'Bosch', 'F026407006', 35.00, 50, ARRAY['Toyota','Honda','Nissan','Hyundai']),
  ('Brake Pads — Front Set', 'Ceramic brake pads, front axle', 'brakes', 'Brembo', 'P23082', 185.00, 20, ARRAY['Toyota','Nissan','Honda']),
  ('Synthetic Engine Oil 5W-30 (4L)', 'Full synthetic, ACEA A5/B5', 'fluids', 'Mobil 1', 'MOB-5W30-4L', 145.00, 30, NULL),
  ('Performance Air Filter', 'Drop-in panel filter', 'filters', 'K&N', '33-2304', 95.00, 15, ARRAY['Toyota','Honda','Subaru']),
  ('Spark Plugs — Set of 4', 'Iridium long-life plugs', 'ignition', 'NGK', 'BKR6EIX-11', 120.00, 25, ARRAY['Toyota','Honda','Nissan']),
  ('Cabin Air Filter', 'Activated carbon pollen filter', 'filters', 'Mann', 'CUK 22 032', 45.00, 40, ARRAY['Toyota','Nissan','Kia']),
  ('Brake Fluid DOT 4 (500ml)', 'High-performance brake fluid', 'fluids', 'ATE', '706202', 28.00, 35, NULL),
  ('Serpentine Belt', 'OEM-spec replacement drive belt', 'belts', 'Gates', 'K060885', 75.00, 12, ARRAY['Toyota','Nissan'])
ON CONFLICT DO NOTHING;
