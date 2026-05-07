"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/types/database";

interface Props {
  vehicles: Vehicle[];
  userId: string;
}

export default function MyGarageScreen({ vehicles: initialVehicles, userId }: Props) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [showAdd, setShowAdd] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function addVehicle() {
    if (!make || !model || !year) return;
    setLoading(true);
    const { data } = await supabase
      .from("vehicles")
      .insert({ user_id: userId, make, model, year: Number(year), build_notes: notes || null })
      .select()
      .single();
    if (data) setVehicles((prev) => [...prev, data]);
    setShowAdd(false);
    setMake(""); setModel(""); setYear(new Date().getFullYear().toString()); setNotes("");
    setLoading(false);
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-3xl text-chrome">MY GARAGE</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ember text-white font-label text-xs uppercase tracking-widest px-4 py-2 rounded-full"
        >
          + Add
        </button>
      </div>

      {/* Add vehicle form */}
      {showAdd && (
        <div className="bg-midnight border border-ember/30 rounded-2xl p-5 mb-5 space-y-3">
          <p className="font-label text-xs text-ember uppercase tracking-widest">Add Vehicle</p>
          {[
            { label: "Make", value: make, set: setMake, placeholder: "Volkswagen" },
            { label: "Model", value: model, set: setModel, placeholder: "Golf GTI" },
            { label: "Year", value: year, set: setYear, placeholder: "2023" },
          ].map((f) => (
            <input
              key={f.label}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              placeholder={f.placeholder}
              className="w-full bg-steel rounded-lg px-4 py-2.5 text-chrome font-body text-sm focus:outline-none focus:ring-1 focus:ring-ember"
            />
          ))}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Build notes (mods, history...)"
            rows={2}
            className="w-full bg-steel rounded-lg px-4 py-2.5 text-chrome font-body text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ember"
          />
          <button
            onClick={addVehicle}
            disabled={loading || !make || !model}
            className="w-full bg-ember text-white font-label text-xs uppercase tracking-widest py-3 rounded-xl disabled:opacity-30"
          >
            {loading ? "Adding..." : "Add to Garage"}
          </button>
        </div>
      )}

      {/* Vehicle list */}
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🚗</div>
          <p className="font-body text-chrome/40 text-sm">No vehicles yet.</p>
          <p className="font-body text-chrome/30 text-xs mt-1">Add your ride to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-midnight border border-steel rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-2xl text-chrome">
                    {v.year} {v.make} {v.model}
                  </p>
                  {v.trim && (
                    <p className="font-label text-xs text-chrome/40 uppercase tracking-wider mt-1">
                      {v.trim}
                    </p>
                  )}
                </div>
                <span className="text-2xl">🔧</span>
              </div>
              {v.build_notes && (
                <div className="mt-4 p-3 bg-steel/50 rounded-xl">
                  <p className="font-label text-xs text-chrome/30 uppercase tracking-wider mb-1">
                    Build Notes
                  </p>
                  <p className="font-body text-sm text-chrome/60">{v.build_notes}</p>
                </div>
              )}
              {v.mileage && (
                <p className="font-label text-xs text-chrome/30 uppercase tracking-wider mt-3">
                  {v.mileage.toLocaleString()} km
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
