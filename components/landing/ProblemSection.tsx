export default function ProblemSection() {
  const problems = [
    {
      icon: "💸",
      title: "Workshop markup is killing your budget",
      body: "Dubai mechanics charge AED 300-500/hr for labour. Half of that is just them using their own tools and space. You're paying for their real estate.",
    },
    {
      icon: "🔧",
      title: "Pro tools cost AED 50,000+",
      body: "A proper set of workshop tools — torque wrenches, OBD scanners, hydraulic lifts — is a year's salary. Most enthusiasts can't justify it for personal use.",
    },
    {
      icon: "🚫",
      title: "No space to work on your car",
      body: "Your apartment basement has 2.1m clearance. Your landlord doesn't want oil stains. There's nowhere in Dubai to actually work on your ride.",
    },
  ];

  return (
    <section className="bg-carbon py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Label */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-px bg-race-red" />
          <span className="font-label text-xs text-race-red uppercase tracking-widest">
            The Problem
          </span>
        </div>

        <h2 className="font-display text-5xl md:text-7xl text-chrome mb-16 max-w-2xl">
          YOU WANT TO DO IT.
          <br />
          <span className="text-race-red">NOTHING LETS YOU.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div
              key={p.title}
              className="bg-steel border border-steel/50 rounded-2xl p-8 hover:border-ember/30 transition-colors"
            >
              <div className="text-4xl mb-5">{p.icon}</div>
              <h3 className="font-display text-2xl text-chrome mb-3">{p.title}</h3>
              <p className="font-body text-chrome/50 leading-relaxed text-sm">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-midnight border border-ember/20 rounded-2xl">
          <p className="font-display text-3xl md:text-5xl text-chrome text-center">
            DRIVEDIY FIXES ALL THREE.{" "}
            <span className="text-ember">AT AED 85/HR.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
