import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { checkBayAvailability } from "@/lib/calendar";

function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { bay_id, start_time, end_time, duration_hours, total_aed, tools } =
    body as {
      bay_id: string;
      start_time: string;
      end_time: string;
      duration_hours: number;
      total_aed: number;
      tools: string[];
    };

  if (!bay_id || !start_time || !end_time || !duration_hours || !total_aed) {
    return NextResponse.json(
      { error: "Missing required booking fields" },
      { status: 400 }
    );
  }

  // ── 1. Check Google Calendar availability (if configured) ──────────────────
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (calendarId) {
    const available = await checkBayAvailability(
      calendarId,
      new Date(start_time),
      new Date(end_time)
    );
    if (!available) {
      return NextResponse.json(
        { error: "That time slot is already booked. Please choose another." },
        { status: 409 }
      );
    }
  }

  // ── 2. Create pending booking in DB ────────────────────────────────────────
  const admin = getSupabaseAdmin();

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      bay_id,
      start_time,
      end_time,
      duration_hours,
      total_aed,
      status: "pending",
      payment_status: "unpaid",
      notes: tools?.length > 0 ? `Tools: ${tools.join(", ")}` : null,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    console.error("Booking insert error:", bookingError);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  // ── 3. Get or create Stripe customer ───────────────────────────────────────
  const { data: userRecord } = await admin
    .from("users")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = userRecord
    ? await getOrCreateStripeCustomer(
        user.id,
        userRecord.email ?? user.email ?? ""
      )
    : undefined;

  // ── 4. Create Stripe Checkout session ──────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aed",
          unit_amount: Math.round(total_aed * 100), // fils
          product_data: {
            name: `DriveDIY Bay Rental — ${duration_hours}hr`,
            description: [
              `Bay booking on ${new Date(start_time).toLocaleDateString("en-AE", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Asia/Dubai",
              })}`,
              tools?.length > 0 ? `Tools: ${tools.join(", ")}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          },
        },
      },
    ],
    payment_intent_data: {
      // These metadata keys are picked up by the Stripe webhook handler
      metadata: {
        bookingId: booking.id,
        userId: user.id,
      },
    },
    success_url: `${appUrl}/dashboard/app?booking=success&id=${booking.id}`,
    cancel_url: `${appUrl}/dashboard/app?booking=cancelled`,
    metadata: {
      bookingId: booking.id,
      userId: user.id,
    },
  });

  if (!session.url) {
    // Clean up the pending booking if Stripe session creation fails
    await admin.from("bookings").delete().eq("id", booking.id);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url, bookingId: booking.id });
}
