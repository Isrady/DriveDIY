import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import type { Part, OrderItem } from "@/types/database";

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

  const { items } = (await req.json()) as {
    items: Array<{ partId: string; qty: number }>;
  };

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const partIds = items.map((i) => i.partId);
  const { data: parts, error: partsError } = await supabase
    .from("parts")
    .select("*")
    .in("id", partIds);

  if (partsError || !parts || parts.length !== partIds.length) {
    return NextResponse.json(
      { error: "One or more parts not found" },
      { status: 404 }
    );
  }

  const partsMap = new Map<string, Part>(parts.map((p: Part) => [p.id, p]));

  for (const item of items) {
    const part = partsMap.get(item.partId);
    if (!part || part.stock_quantity < item.qty) {
      return NextResponse.json(
        { error: `Insufficient stock for ${part?.name ?? item.partId}` },
        { status: 409 }
      );
    }
  }

  const orderItems: OrderItem[] = items.map((item) => {
    const part = partsMap.get(item.partId)!;
    return { part_id: item.partId, name: part.name, qty: item.qty, price: part.price_aed };
  });

  const totalAed = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const admin = getAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total_aed: totalAed,
      items: orderItems,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Failed to create order" },
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

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    line_items: orderItems.map((item) => ({
      price_data: {
        currency: "aed",
        unit_amount: Math.round(item.price * 100),
        product_data: { name: item.name },
      },
      quantity: item.qty,
    })),
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app?payment=success&order_id=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/app`,
    payment_intent_data: {
      metadata: { orderId: order.id, userId: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
