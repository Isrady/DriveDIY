export default function Stats() {
  const stats = [
    { value: "5", label: "Professional Bays", desc: "Standard + lift + detail" },
    { value: "AED 85", label: "Drop-In Rate", desc: "Per hour, all inclusive" },
    { value: "3,500kg", label: "Max Lift Capacity", desc: "4-post hydraulic" },
    { value: "0", label: "Hidden Fees", desc: "What you see is what you pay" },
    { value: "4", label: "Languages", desc: "EN · AR · UR · TL" },
    { value: "24/7", label: "AI Support", desc: "Commander always on" },
  ];

  return (
    <section className="bg-midnight py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-steel rounded-2xl overflow-hidden">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-midnight hover:bg-carbon transition-colors p-8 text-center"
            >
              <div className="font-display text-3xl md:text-4xl text-ember mb-2">
                {s.value}
              </div>
              <div className="font-label text-xs text-chrome uppercase tracking-widest mb-1">
                {s.label}
              </div>
              <div className="font-body text-xs text-chrome/30">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
