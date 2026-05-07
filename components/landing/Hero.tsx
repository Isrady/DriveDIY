import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-midnight">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(188,198,212,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(188,198,212,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Red accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-race-red via-ember to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-8 h-px bg-ember" />
          <span className="font-label text-xs text-ember uppercase tracking-widest">
            Al Quoz, Dubai · Opening Soon
          </span>
          <div className="w-8 h-px bg-ember" />
        </div>

        {/* Main headline */}
        <h1 className="font-display text-[clamp(56px,12vw,160px)] leading-none text-chrome tracking-wide mb-6">
          YOUR BAY.
          <br />
          YOUR TOOLS.
          <br />
          <span className="text-ember">YOUR BUILD.</span>
        </h1>

        {/* Subheading */}
        <p className="font-body text-lg md:text-xl text-chrome/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Dubai&apos;s first DIY car servicing facility. Rent a professional bay,
          use pro tools, and finally do it yourself — without the workshop markup.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="bg-ember hover:bg-race-red text-white font-label text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-ember/20"
          >
            Book a Bay — AED 85/hr
          </Link>
          <a
            href="#how-it-works"
            className="border border-steel hover:border-chrome text-chrome font-label text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-colors"
          >
            How It Works
          </a>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-12 mt-20 pt-12 border-t border-steel">
          {[
            { value: "5", label: "Professional Bays" },
            { value: "AED 85", label: "Per Hour, No BS" },
            { value: "2+4", label: "Post Hydraulic Lifts" },
            { value: "24/7", label: "AI Support" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-4xl text-ember">{stat.value}</div>
              <div className="font-label text-xs text-chrome/40 uppercase tracking-widest mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-midnight to-transparent" />
    </section>
  );
}
