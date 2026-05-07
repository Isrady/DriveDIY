import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { sendBookingConfirmationWhatsApp } from "@/lib/twilio";
import { sendBookingConfirmation } from "@/lib/email";

export const maxDuration = 10;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Webhook error";
    return new NextResponse(`Webhook signature verification failed: ${msg}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { bookingId, userId } = paymentIntent.metadata;
  if (!bookingId) return;

  // Update booking payment status
  const { data: booking } = await getSupabaseAdmin()
    .from("bookings")
    .update({
      payment_status: "paid",
      payment_intent_id: paymentIntent.id,
      status: "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .select(`*, bays(name), users(email, full_name, phone)`)
    .single();

  if (!booking) return;

  // Send confirmation communications
  const user = booking.users as { email: string; full_name: string; phone: string } | null;
  const bay = booking.bays as { name: string } | null;

  if (user && bay) {
    const params = {
      bayName: bay.name,
      startTime: new Date(booking.start_time),
      endTime: new Date(booking.end_time),
      totalAED: booking.total_aed,
      bookingId: booking.id,
      customerName: user.full_name ?? "there",
    };

    // Send email confirmation
    if (user.email) {
      sendBookingConfirmation({ to: user.email, ...params }).catch(console.error);
    }

    // Send WhatsApp confirmation
    if (user.phone) {
      sendBookingConfirmationWhatsApp({ to: user.phone, ...params }).catch(console.error);
    }
  }

  // Log event
  await getSupabaseAdmin().from("events").insert({
    event_type: "booking_paid",
    title: `Booking paid: ${bookingId.slice(0, 8).toUpperCase()}`,
    body: `Payment of AED ${paymentIntent.amount / 100} confirmed`,
    entity_type: "booking",
    entity_id: bookingId,
  });
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  let tier: "builder" | "gearhead" | "drop_in" = "drop_in";
  if (priceId === process.env.STRIPE_BUILDER_PRICE_ID) tier = "builder";
  else if (priceId === process.env.STRIPE_GEARHEAD_PRICE_ID) tier = "gearhead";

  await getSupabaseAdmin()
    .from("users")
    .update({
      subscription_tier: tier,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await getSupabaseAdmin()
    .from("users")
    .update({
      subscription_tier: "drop_in",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", customerId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Log event
  await getSupabaseAdmin().from("events").insert({
    event_type: "payment_failed",
    title: "Subscription payment failed",
    body: `Customer ${customerId} — invoice ${invoice.id}`,
    entity_type: "invoice",
    metadata: { customerId, invoiceId: invoice.id },
  });
}
