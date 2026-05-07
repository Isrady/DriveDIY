import Link from "next/link";

export default function Pricing() {
  const plans = [
    {
      name: "Drop-In",
      price: "AED 85",
      unit: "per hour",
      description: "Pay as you go. No commitment, no monthly fees.",
      features: [
        "Bay rental by the hour",
        "Basic tool access",
        "AI assistant",
        "Community access",
        "Standard parts pricing",
      ],
      cta: "Book a Bay",
      highlight: false,
    },
    {
      name: "Builder",
      price: "AED 349",
      unit: "per month",
      description: "For the regular wrench-turner. 10 hours included.",
      features: [
        "10 bay hours per month",
        "Full tool kit included (AED 25 value/session)",
        "Parts at cost price",
        "Priority booking",
        "AI assistant + build log",
        "Academy unlimited access",
      ],
      cta: "Start Building",
      highlight: true,
      savings: "Save AED 500+/mo vs drop-in",
    },
    {
      name: "Gearhead",
      price: "AED 749",
      unit: "per month",
      description: "Unlimited access. For the seriously obsessed.",
      features: [
        "Unlimited bay hours",
        "All tools always included",
        "Trade parts pricing",
        "Mechanic Assist discount (AED 90/hr)",
        "First access to new bays",
        "Private build storage locker",
        "Monthly garage night invite",
      ],
      cta: "Go Unlimited",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-midnight py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-px bg-ember" />
          <span className="font-label text-xs text-ember uppercase tracking-widest">
            Pricing
          </span>
        </div>

        <h2 className="font-display text-5xl md:text-7xl text-chrome mb-4">
          STRAIGHT PRICING.
          <br />
          <span className="text-ember">ZERO MARKUP.</span>
        </h2>
        <p className="font-body text-chrome/50 mb-16 text-lg">
          No joining fee. No deposit. Cancel anytime.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col transition-all ${
                plan.highlight
                  ? "bg-carbon border-2 border-ember shadow-lg shadow-ember/10 scale-105"
                  : "bg-carbon border border-steel"
              }`}
            >
              {plan.highlight && (
                <div className="bg-ember text-white font-label text-xs uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-6">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className="font-label text-sm text-chrome/40 uppercase tracking-widest mb-1">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl text-chrome">{plan.price}</span>
                  <span className="font-label text-xs text-chrome/40 uppercase">{plan.unit}</span>
                </div>
                {plan.savings && (
                  <div className="font-label text-xs text-ember mt-1">{plan.savings}</div>
                )}
              </div>

              <p className="font-body text-chrome/50 text-sm mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className={`mt-0.5 ${plan.highlight ? "text-ember" : "text-chrome/40"}`}>
                      ✓
                    </span>
                    <span className="font-body text-chrome/60 text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className={`block text-center font-label text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors ${
                  plan.highlight
                    ? "bg-ember hover:bg-race-red text-white"
                    : "border border-steel hover:border-chrome text-chrome"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
