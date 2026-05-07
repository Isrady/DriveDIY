export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Choose Your Bay",
      body: "Pick a standard bay or a 2-post/4-post hydraulic lift. Select your date and time. Confirm in under 2 minutes.",
    },
    {
      num: "02",
      title: "Drive In",
      body: "Roll into Al Quoz. Check in at the desk. Your bay is set up, compressed air is live, and tools are ready.",
    },
    {
      num: "03",
      title: "Grab Your Tools",
      body: "AED 25 gets you a full kit — torque wrenches, OBD scanner, oil extractor, brake bleeder. All pro grade.",
    },
    {
      num: "04",
      title: "Get It Done",
      body: "Work at your pace. If you get stuck, hit the AI assistant or book a mechanic on-demand for AED 120/hr.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-midnight py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-px bg-ember" />
          <span className="font-label text-xs text-ember uppercase tracking-widest">
            How It Works
          </span>
        </div>

        <h2 className="font-display text-5xl md:text-7xl text-chrome mb-16">
          FOUR STEPS.
          <br />
          <span className="text-ember">DONE.</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-steel z-0" style={{ width: "calc(100% - 2rem)" }} />
              )}

              <div className="relative bg-carbon border border-steel rounded-2xl p-8 hover:border-ember/30 transition-colors">
                <div className="font-display text-6xl text-ember/20 leading-none mb-4">
                  {step.num}
                </div>
                <h3 className="font-display text-2xl text-chrome mb-3">{step.title}</h3>
                <p className="font-body text-chrome/50 text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
