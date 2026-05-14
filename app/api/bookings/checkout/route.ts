import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { checkBayAvailability } from "@/lib/calendar";

function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bayId, startTime, endTime, durationHours, totalAed, tools } =
    (await req.json()) as {
      bayId: string;
      startTime: string;
      endTime: string;
      durationHours: number;
      totalAed: number;
      tools: string[];
    };

  const { data: bay } = await supabase
    .from("bays")
    .select("*")
    .eq("id", bayId)
    .single();

  if (!bay || !bay.is_active) {
    return NextResponse.json({ error: "Bay not found" }, { status: 404 });
  }

  const hasCalendarCreds =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_CLIENT_ID;

  if (bay.google_calendar_id && hasCalendarCreds) {
    const available = await checkBayAvailability(
      bay.google_calendar_id,
      new Date(startTime),
      new Date(endTime)
    );
    if (!available) {
      return NextResponse.json(
        { error: "Bay not available at selected time" },
        { status: 409 }
      );
    }
  }

  const admin = getAdminClient();
  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .insert({
      user_id: user.id,
      bay_id: bayId,
      start_time: startTime,
      end_time: endTime,
      duration_hours: durationHours,
      total_aed: totalAed,
      status: "pending",
      payment_status: "unpaid",
      notes: tools.length > 0 ? `Tools: ${tools.join(", ")}` : null,
    })
    .select()
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    profile?.email ?? user.email!
  );

  const label = `${bay.name} — ${durationHours}hr Bay Rental${tools.length > 0 ? " + Tool Kit" : ""}`;

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "aed",
          unit_amount: Math.round(totalAed * 100),
          product_data: { name: label },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app?payment=success&booking_id=${booking.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app`,
    payment_intent_data: {
      metadata: { bookingId: booking.id, userId: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
