"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BAYS = [
  { id: "bay-1", name: "Bay 1", type: "Standard", price: 85, icon: "🏗️" },
  { id: "bay-2", name: "Bay 2", type: "Standard", price: 85, icon: "🏗️" },
  { id: "bay-3", name: "Bay 3", type: "2-Post Lift", price: 85, icon: "⬆️" },
  { id: "bay-4", name: "Bay 4", type: "4-Post Lift", price: 85, icon: "⬆️" },
  { id: "bay-5", name: "Bay 5", type: "Detail Bay", price: 85, icon: "✨" },
];

const TOOLS = [
  "Torque Wrench Kit",
  "OBD2 Scanner",
  "Oil Extractor Pump",
  "Brake Bleeder Kit",
  "Impact Wrench",
  "Jack Stand Set",
];

const TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

export default function BookBayScreen({ userId }: { userId: string }) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(2);
  const [selectedBay, setSelectedBay] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();
  const total = selectedBay ? hours * 85 + (selectedTools.length > 0 ? 25 : 0) : 0;

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  }

  async function handleConfirm() {
    if (!selectedBay || !date || !time) return;
    setLoading(true);

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    const bay = BAYS.find((b) => b.id === selectedBay);

    await supabase.from("bookings").insert({
      user_id: userId,
      bay_id: selectedBay,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_hours: hours,
      total_aed: total,
      status: "pending",
      payment_status: "unpaid",
      notes: selectedTools.length > 0 ? `Tools: ${selectedTools.join(", ")}` : null,
    });

    setLoading(false);
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="p-5 flex flex-col items-center justify-center h-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-display text-3xl text-chrome mb-2">Booked!</h2>
        <p className="font-body text-chrome/50 text-sm mb-6">
          Your bay is reserved. Payment completes at check-in or online.
        </p>
        <button
          onClick={() => { setSuccess(false); setStep(1); setSelectedBay(null); setDate(""); setTime(""); }}
          className="bg-ember text-white font-label text-xs uppercase tracking-widest px-6 py-3 rounded-xl"
        >
          Book Another
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-display text-3xl text-chrome">BOOK A BAY</h2>
        {/* Progress dots */}
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
              Duration: {hours}hr — AED {hours * 85}
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
          <div className="space-y-3">
            {BAYS.map((bay) => (
              <button
                key={bay.id}
                onClick={() => setSelectedBay(bay.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selectedBay === bay.id
                    ? "border-ember bg-ember/10"
                    : "border-steel bg-steel hover:border-chrome/30"
                }`}
              >
                <span className="text-2xl">{bay.icon}</span>
                <div className="flex-1">
                  <p className="font-display text-xl text-chrome">{bay.name}</p>
                  <p className="font-label text-xs text-chrome/40 uppercase tracking-wider">
                    {bay.type}
                  </p>
                </div>
                <span className="font-display text-xl text-ember">
                  {bay.price}
                  <span className="text-sm">/hr</span>
                </span>
              </button>
            ))}
          </div>
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

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="font-label text-xs text-chrome/40 uppercase tracking-widest">
            Step 4 — Confirm
          </p>
          <div className="bg-midnight border border-steel rounded-xl p-5 space-y-3">
            {[
              { label: "Date", value: date },
              { label: "Time", value: `${time} · ${hours}hr` },
              { label: "Bay", value: BAYS.find((b) => b.id === selectedBay)?.name ?? "" },
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
          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="flex-1 border border-steel text-chrome font-label text-sm uppercase tracking-widest py-4 rounded-xl"
            >
              ← Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-ember text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl disabled:opacity-50"
            >
              {loading ? "..." : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
