"use client";

import { useState } from "react";

const SERVICES = [
  {
    id: "bay",
    label: "Bay Rental",
    icon: "🏗️",
    headline: "Your own bay. No supervision.",
    body: "Rent by the hour. Drive in, work at your own pace, leave when you're done. No mechanics hovering, no minimum spend, no upselling.",
    features: [
      "5 professional bays in Al Quoz",
      "2-post lifts (3,500kg) and 4-post lifts (5,000kg)",
      "Compressed air at every bay",
      "Full LED workshop lighting",
      "Drain pans and waste disposal included",
    ],
    price: "AED 85",
    unit: "per hour",
    color: "ember",
  },
  {
    id: "tools",
    label: "Tool Rental",
    icon: "🔧",
    headline: "AED 25. Every pro tool you need.",
    body: "Stop borrowing from friends or buying once. For AED 25 you get a complete kit for your session — calibrated, clean, and ready.",
    features: [
      "Torque wrench set (20-200 Nm)",
      "Professional OBD2 diagnostic scanner",
      "Pneumatic oil extractor (12L)",
      "Vacuum brake bleeder kit",
      "1/2\" impact wrench",
      "3-ton jack stands (pair)",
    ],
    price: "AED 25",
    unit: "per session",
    color: "chrome",
  },
  {
    id: "parts",
    label: "Parts",
    icon: "⚙️",
    headline: "OEM and aftermarket. Bundled for your job.",
    body: "We source the parts you need, check compatibility for your exact vehicle, and have them ready at your bay before you arrive.",
    features: [
      "OEM and quality aftermarket brands",
      "Pre-bundled by job type (oil change, brake job, etc.)",
      "VIN-matched compatibility check",
      "Builder members pay cost price",
      "Gearhead members pay trade price",
    ],
    price: "Cost",
    unit: "to trade pricing",
    color: "chrome",
  },
  {
    id: "academy",
    label: "DIY Academy",
    icon: "🎓",
    headline: "Learn it right. In your language.",
    body: "Step-by-step video guides for every job level. English, Arabic, Urdu, and Tagalog. From oil changes to suspension upgrades.",
    features: [
      "Video guides in EN / AR / UR / TL",
      "Beginner to advanced tracks",
      "Vehicle-specific walkthroughs",
      "Live AI assistant during your session",
      "Community Q&A and build threads",
    ],
    price: "Free",
    unit: "with membership",
    color: "ember",
  },
  {
    id: "mechanic",
    label: "Mechanic Assist",
    icon: "🤝",
    headline: "Stuck? We've got a mechanic.",
    body: "Book a certified mechanic to work alongside you. Learn while they help. Keep control of your build without getting stranded.",
    features: [
      "On-demand — book same day",
      "Certified and background-checked mechanics",
      "They assist, you stay in control",
      "Billed per hour, not per job",
      "Available in EN, AR, and Urdu",
    ],
    price: "AED 120",
    unit: "per hour",
    color: "race-red",
  },
];

export default function ServicesTabSwitcher() {
  const [active, setActive] = useState("bay");
  const service = SERVICES.find((s) => s.id === active)!;

  return (
    <section id="services" className="bg-carbon py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-px bg-ember" />
          <span className="font-label text-xs text-ember uppercase tracking-widest">
            Services
          </span>
        </div>

        <h2 className="font-display text-5xl md:text-7xl text-chrome mb-12">
          EVERYTHING YOU NEED.
          <br />
          <span className="text-ember">NOTHING YOU DON&apos;T.</span>
        </h2>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 mb-10">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`font-label text-xs uppercase tracking-widest px-5 py-2.5 rounded-full transition-all ${
                active === s.id
                  ? "bg-ember text-white"
                  : "bg-steel text-chrome/60 hover:text-chrome"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Service card */}
        <div className="bg-midnight border border-steel rounded-2xl p-8 md:p-12 grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-display text-4xl md:text-5xl text-chrome mb-4">
              {service.headline}
            </h3>
            <p className="font-body text-chrome/60 text-base leading-relaxed mb-8">
              {service.body}
            </p>
            <ul className="space-y-3">
              {service.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="text-ember mt-0.5">✓</span>
                  <span className="font-body text-chrome/70 text-sm">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-between">
            <div className="bg-steel rounded-xl p-8 text-center">
              <div className="font-display text-6xl text-ember mb-1">{service.price}</div>
              <div className="font-label text-xs text-chrome/40 uppercase tracking-widest">
                {service.unit}
              </div>
            </div>

            <a
              href="/auth/signup"
              className="mt-6 block text-center bg-ember hover:bg-race-red text-white font-label text-sm uppercase tracking-widest py-4 rounded-xl transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
