"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Where exactly is DriveDIY located?",
    a: "We&apos;re opening in Al Quoz Industrial Area, Dubai — the heart of Dubai&apos;s creative and automotive scene. Exact address and directions will be confirmed on opening. Near Sheikh Zayed Road for easy access.",
  },
  {
    q: "Do I need to bring anything?",
    a: "Just your car and yourself. We provide the bay, tools, compressed air, lighting, and disposal. Wear clothes you don&apos;t mind getting oil on — or grab a workshop suit from our front desk.",
  },
  {
    q: "What if I get stuck mid-job?",
    a: "Three options: 1) Ask our AI assistant (built into the dashboard, knows your vehicle), 2) Check the DIY Academy guides, or 3) Book a Mechanic Assist for AED 120/hr — a certified mechanic will come to your bay.",
  },
  {
    q: "Can I bring my own tools?",
    a: "Absolutely. You can use our tools, yours, or a mix. The bay rental includes the space, equipment, and infrastructure. Tool kits are optional at AED 25.",
  },
  {
    q: "Are the hydraulic lifts safe for my car?",
    a: "Yes. Our 2-post lifts handle up to 3,500kg and 4-post up to 5,000kg. We provide lift points for common vehicles and the team walks you through the first lift setup.",
  },
  {
    q: "How do I book a bay?",
    a: "Sign up on the app or website, pick your bay type, choose your date and time slot, and pay. You&apos;ll get a WhatsApp confirmation with your booking ID. Check-in at the front desk — takes 2 minutes.",
  },
  {
    q: "Can I cancel or reschedule?",
    a: "Yes — cancellations up to 24 hours before your booking get a full refund. Reschedule any time up to 4 hours before. No-shows are charged in full.",
  },
  {
    q: "Is there parking?",
    a: "Yes — Al Quoz industrial units have large vehicle access. You drive into the facility and your car goes directly into the bay.",
  },
  {
    q: "Is it suitable for beginners?",
    a: "Completely. That&apos;s why we built it. The Beginner Workshop events are designed exactly for this — or book a bay with Mechanic Assist for your first session and learn hands-on.",
  },
  {
    q: "Do you speak Arabic?",
    a: "Yes. Our team and AI support English and Arabic. The DIY Academy has guides in Arabic, Urdu, and Tagalog as well.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-carbon py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-px bg-ember" />
          <span className="font-label text-xs text-ember uppercase tracking-widest">FAQ</span>
        </div>

        <h2 className="font-display text-5xl md:text-6xl text-chrome mb-12">
          COMMON QUESTIONS
        </h2>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="border border-steel rounded-xl overflow-hidden hover:border-steel/80 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-body text-chrome font-medium pr-4">{faq.q}</span>
                <span
                  className={`text-ember text-xl transition-transform flex-shrink-0 ${
                    openIndex === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>

              {openIndex === i && (
                <div className="px-6 pb-6">
                  <p
                    className="font-body text-chrome/60 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.a }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
