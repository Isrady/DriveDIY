export interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: "customer" | "admin" | "mechanic";
  subscription_tier: "drop_in" | "builder" | "gearhead";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  preferred_language: "en" | "ar" | "ur" | "tl";
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  build_notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bay {
  id: string;
  name: string;
  description: string | null;
  bay_type: "standard" | "lift" | "detail";
  lift_capacity_kg: number | null;
  hourly_rate_aed: number;
  is_active: boolean;
  amenities: string[];
  google_calendar_id: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  bay_id: string;
  vehicle_id: string | null;
  start_time: string;
  end_time: string;
  duration_hours: number;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled" | "no_show";
  payment_intent_id: string | null;
  payment_status: "unpaid" | "paid" | "refunded";
  total_aed: number;
  notes: string | null;
  google_event_id: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string | null;
  category: string;
  brand: string | null;
  model_number: string | null;
  daily_rate_aed: number;
  is_available: boolean;
  condition: "excellent" | "good" | "fair" | "needs_service";
  image_url: string | null;
  created_at: string;
}

export interface ToolRental {
  id: string;
  booking_id: string;
  tool_id: string;
  user_id: string;
  rented_at: string;
  returned_at: string | null;
  condition_out: string | null;
  condition_in: string | null;
  notes: string | null;
}

export interface Part {
  id: string;
  name: string;
  description: string | null;
  category: string;
  brand: string | null;
  part_number: string | null;
  price_aed: number;
  stock_quantity: number;
  reorder_threshold: number;
  compatible_makes: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "fulfilled" | "cancelled";
  total_aed: number;
  stripe_payment_intent_id: string | null;
  items: OrderItem[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  part_id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Customer {
  id: string;
  lifetime_value_aed: number;
  total_bookings: number;
  last_visit_at: string | null;
  acquisition_channel: string | null;
  nationality: string | null;
  car_interests: string[];
  preferred_contact: "whatsapp" | "email" | "sms";
  whatsapp_number: string | null;
  notes: string | null;
  tags: string[];
  updated_at: string;
}

export interface AgentLog {
  id: string;
  agent: string;
  user_id: string | null;
  session_id: string | null;
  input_tokens: number;
  output_tokens: number;
  model: string;
  prompt: string;
  response: string;
  latency_ms: number | null;
  error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PendingPermission {
  id: string;
  agent: string;
  action: string;
  description: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
}

export interface Event {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LaunchChecklist {
  id: string;
  category: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  priority: number;
  notes: string | null;
  created_at: string;
}

export interface Recommendation {
  id: string;
  agent: string;
  title: string;
  body: string;
  action_type: string | null;
  action_payload: Record<string, unknown>;
  priority: "critical" | "high" | "medium" | "low";
  is_dismissed: boolean;
  dismissed_at: string | null;
  expires_at: string | null;
  created_at: string;
}
