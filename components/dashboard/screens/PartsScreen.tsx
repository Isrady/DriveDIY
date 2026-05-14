"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Part } from "@/types/database";

type CartEntry = { part: Part; qty: number };

const CATEGORY_LABELS: Record<string, string> = {
  filters: "Filters",
  brakes: "Brakes",
  fluids: "Fluids",
  ignition: "Ignition",
  belts: "Belts",
};

export default function PartsScreen() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<Map<string, CartEntry>>(new Map());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("parts")
      .select("*")
      .gt("stock_quantity", 0)
      .order("category")
      .then(({ data }) => {
        setParts(data ?? []);
        setLoading(false);
      });
  }, []);

  const categories = ["all", ...Array.from(new Set(parts.map((p) => p.category)))];
  const filtered = categoryFilter === "all" ? parts : parts.filter((p) => p.category === categoryFilter);

  const cartCount = Array.from(cart.values()).reduce((sum, e) => sum + e.qty, 0);
  const cartTotal = Array.from(cart.values()).reduce(
    (sum, e) => sum + e.part.price_aed * e.qty,
    0
  );

  function addToCart(part: Part) {
    setCart((prev) => {
      const next = new Map(prev);
      const entry = next.get(part.id);
      next.set(part.id, { part, qty: (entry?.qty ?? 0) + 1 });
      return next;
    });
  }

  function setQty(partId: string, qty: number) {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(partId);
      else next.set(partId, { ...next.get(partId)!, qty });
      return next;
    });
  }

  async function handleCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const items = Array.from(cart.values()).map((e) => ({
        partId: e.part.id,
        qty: e.qty,
      }));
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCheckoutError(data.error ?? "Checkout failed");
        setCheckingOut(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Network error. Please try again.");
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="p-5">
        <h2 className="font-display text-3xl text-chrome mb-5">PARTS SHOP</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-steel rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-3xl text-chrome">PARTS SHOP</h2>
        {cartCount > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-ember text-white rounded-full w-10 h-10 flex items-center justify-center text-lg"
          >
            🛒
            <span className="absolute -top-1 -right-1 bg-race-red text-white text-[10px] font-label rounded-full w-4 h-4 flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full font-label text-xs uppercase tracking-wider whitespace-nowrap flex-shrink-0 transition-colors ${
              categoryFilter === cat ? "bg-ember text-white" : "bg-steel text-chrome/60"
            }`}
          >
            {cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {/* Parts list */}
      <div className="space-y-3">
        {filtered.map((part) => {
          const inCart = cart.get(part.id)?.qty ?? 0;
          return (
            <div
              key={part.id}
              className="bg-midnight border border-steel rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-chrome font-medium leading-snug">
                  {part.name}
                </p>
                {part.brand && (
                  <p className="font-label text-xs text-chrome/40 uppercase tracking-wider mt-0.5">
                    {part.brand}
                    {part.part_number ? ` · ${part.part_number}` : ""}
                  </p>
                )}
                {part.compatible_makes && part.compatible_makes.length > 0 && (
                  <p className="font-label text-[10px] text-chrome/30 mt-1">
                    {part.compatible_makes.slice(0, 3).join(" · ")}
                    {part.compatible_makes.length > 3 ? " +" : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className="font-display text-xl text-ember">
                  {part.price_aed}
                  <span className="text-xs font-body"> AED</span>
                </span>
                {inCart === 0 ? (
                  <button
                    onClick={() => addToCart(part)}
                    className="bg-ember text-white font-label text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg"
                  >
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQty(part.id, inCart - 1)}
                      className="w-7 h-7 rounded-lg bg-steel text-chrome font-label text-sm flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="font-label text-sm text-ember w-4 text-center">{inCart}</span>
                    <button
                      onClick={() => setQty(part.id, inCart + 1)}
                      className="w-7 h-7 rounded-lg bg-steel text-chrome font-label text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-midnight/80"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative bg-carbon border-t border-steel rounded-t-3xl p-5 space-y-4 max-h-[70%] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl text-chrome">CART</h3>
              <button
                onClick={() => setCartOpen(false)}
                className="text-chrome/40 hover:text-chrome text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {Array.from(cart.values()).map(({ part, qty }) => (
                <div key={part.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-chrome truncate">{part.name}</p>
                    <p className="font-label text-xs text-chrome/40">
                      AED {part.price_aed} × {qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setQty(part.id, qty - 1)}
                      className="w-7 h-7 rounded-lg bg-steel text-chrome font-label text-sm flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="font-label text-sm text-ember w-4 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(part.id, qty + 1)}
                      className="w-7 h-7 rounded-lg bg-steel text-chrome font-label text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-steel pt-3 flex justify-between items-center">
              <span className="font-label text-xs text-chrome/40 uppercase tracking-wider">Total</span>
              <span className="font-display text-2xl text-ember">AED {cartTotal.toFixed(2)}</span>
            </div>

            {checkoutError && (
              <p className="font-body text-xs text-race-red text-center">{checkoutError}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkingOut || cartCount === 0}
              className="w-full bg-ember text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 transition-opacity"
            >
              {checkingOut ? "Redirecting..." : `Pay AED ${cartTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
