"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bay } from "@/types/database";

const BAY_ICONS: Record<string, string> = {
  standard: "🏗️",
  lift: "⬆️",
  detail: "✨",
};

const TOOLS = [
  "Torque Wrench Kit",
  "OBD2 Scanner",
  "Oil Extractor Pump",
  "Brake Bleeder Kit",
  "Impact Wrench",
  "Jack Stand Set",
];

const TIME_SLOTS = [
  "07:00","08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00",
  "19:00","20:00","21:00",
];

export default function BookBayScreen({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(2);
  const [bays, setBays] = useState<Bay[]>([]);
  const [baysLoading, setBaysLoading] = useState(true);
  const [selectedBay, setSelectedBay] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("bays")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        setBays(data ?? []);
        setBaysLoading(false);
      });
  }, []);

  const bayRate = bays.find((b) => b.id === selectedBay)?.hourly_rate_aed ?? 85;
  const total = selectedBay ? hours * bayRate + (selectedTools.length > 0 ? 25 : 0) : 0;

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  async function handleConfirm() {
    if (!selectedBay || !date || !time) return;
    setLoading(true);
    setError(null);

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    try {
      const res = await fetch("/api/bookings/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bayId: selectedBay,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationHours: hours,
          totalAed: total,
          tools: selectedTools,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // userId is required for the booking association
  void userId;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-display text-3xl text-chrome">BOOK A BAY</h2>
        <div className="flex gap-2 mt-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-8 bg-ember" : s < step ? "w-4 bg-ember/50" : "w-4 bg-steel"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="font-label text-xs text-chrome/40 uppercase tracking-widest">
            Step 1 — When?
          </p>
          <div>
            <label className="font-label text-xs text-chrome/50 uppercase tracking-wider block mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-steel rounded-xl px-4 py-3 text-chrome font-body text-sm focus:outline-none focus:ring-1 focus:ring-ember"
            />
          </div>
          <div>
            <label className="font-label text-xs text-chrome/50 uppercase tracking-wider block mb-2">
              Start Time
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`py-2 rounded-lg font-label text-xs transition-colors ${
                    time === t ? "bg-ember text-white" : "bg-steel text-chrome/60 hover:text-chrome"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-label text-xs text-chrome/50 uppercase tracking-wider block mb-2">
              Duration: {hours}hr — AED {hours * bayRate}
            </label>
            <input
              type="range"
              min={1}
              max={8}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full accent-ember"
            />
            <div className="flex justify-between font-label text-xs text-chrome/30 mt-1">
              <span>1hr</span><span>8hr</span>
            </div>
          </div>
          <button
            disabled={!date || !time}
            onClick={() => setStep(2)}
            className="w-full bg-ember text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl disabled:opacity-30 transition-opacity"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step 2: Bay Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="font-label text-xs text-chrome/40 uppercase tracking-widest">
            Step 2 — Which Bay?
          </p>
          {baysLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-steel rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {bays.map((bay) => (
                <button
                  key={bay.id}
                  onClick={() => setSelectedBay(bay.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    selectedBay === bay.id
                      ? "border-ember bg-ember/10"
                      : "border-steel bg-steel hover:border-chrome/30"
                  }`}
                >
                  <span className="text-2xl">{BAY_ICONS[bay.bay_type] ?? "🏗️"}</span>
                  <div className="flex-1">
                    <p className="font-display text-xl text-chrome">{bay.name}</p>
                    <p className="font-label text-xs text-chrome/40 uppercase tracking-wider">
                      {bay.bay_type.replace("_", " ")}
                    </p>
                  </div>
                  <span className="font-display text-xl text-ember">
                    {bay.hourly_rate_aed}
                    <span className="text-sm">/hr</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-steel text-chrome font-label text-sm uppercase tracking-widest py-4 rounded-xl"
            >
              ← Back
            </button>
            <button
              disabled={!selectedBay}
              onClick={() => setStep(3)}
              className="flex-1 bg-ember text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Tools */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="font-label text-xs text-chrome/40 uppercase tracking-widest">
            Step 3 — Tools? (AED 25 kit)
          </p>
          <div className="space-y-2">
            {TOOLS.map((tool) => (
              <button
                key={tool}
                onClick={() => toggleTool(tool)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  selectedTools.includes(tool)
                    ? "border-ember bg-ember/10"
                    : "border-steel bg-steel"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedTools.includes(tool) ? "border-ember bg-ember" : "border-chrome/30"
                  }`}
                >
                  {selectedTools.includes(tool) && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </div>
                <span className="font-body text-sm text-chrome/80">{tool}</span>
              </button>
            ))}
          </div>
          {selectedTools.length > 0 && (
            <p className="font-label text-xs text-ember text-center">
              +AED 25 tool kit fee
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-steel text-chrome font-label text-sm uppercase tracking-widest py-4 rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-ember text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Pay */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="font-label text-xs text-chrome/40 uppercase tracking-widest">
            Step 4 — Confirm & Pay
          </p>
          <div className="bg-midnight border border-steel rounded-xl p-5 space-y-3">
            {[
              { label: "Date", value: date },
              { label: "Time", value: `${time} · ${hours}hr` },
              { label: "Bay", value: bays.find((b) => b.id === selectedBay)?.name ?? "" },
              { label: "Tools", value: selectedTools.length > 0 ? "Kit included" : "None" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="font-label text-xs text-chrome/30 uppercase tracking-wider">
                  {row.label}
                </span>
                <span className="font-body text-sm text-chrome">{row.value}</span>
              </div>
            ))}
            <div className="border-t border-steel pt-3 flex justify-between">
              <span className="font-label text-xs text-chrome/30 uppercase tracking-wider">
                Total
              </span>
              <span className="font-display text-2xl text-ember">AED {total}</span>
            </div>
          </div>

          {error && (
            <p className="font-body text-xs text-race-red text-center bg-race-red/10 border border-race-red/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(3); setError(null); }}
              className="flex-1 border border-steel text-chrome font-label text-sm uppercase tracking-widest py-4 rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-ember text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl disabled:opacity-50"
            >
              {loading ? "..." : "Pay Now"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
