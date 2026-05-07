export default function Community() {
  const events = [
    {
      tag: "MONTHLY",
      title: "GTI Night",
      body: "Volkswagen and hot hatch owners take over the bays. Show your build, swap tips, and get your hands dirty.",
      icon: "🏎️",
    },
    {
      tag: "BI-WEEKLY",
      title: "JDM Sunday",
      body: "Japanese iron only. Civics, Supras, RX-7s — Al Quoz garage nights for the JDM community.",
      icon: "🇯🇵",
    },
    {
      tag: "MONTHLY",
      title: "Beginner Workshop",
      body: "New to working on cars? Our structured intro workshop covers the basics with certified instructors.",
      icon: "🎓",
    },
    {
      tag: "QUARTERLY",
      title: "Dubai Car Meet",
      body: "DriveDIY hosts the largest DIY car meet in the UAE. All makes, all builds, all welcome.",
      icon: "🚗",
    },
  ];

  return (
    <section id="community" className="bg-carbon py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-px bg-ember" />
          <span className="font-label text-xs text-ember uppercase tracking-widest">
            Community
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="font-display text-5xl md:text-7xl text-chrome leading-none">
              THIS IS MORE
              <br />
              THAN A GARAGE.
              <br />
              <span className="text-ember">IT&apos;S A SCENE.</span>
            </h2>
          </div>
          <div className="flex items-center">
            <p className="font-body text-chrome/60 text-lg leading-relaxed">
              Al Quoz has always been Dubai&apos;s creative industrial heartbeat.
              DriveDIY brings the car culture there — regular events, a tight
              community, and a place for UAE enthusiasts to actually connect
              over builds instead of just Instagram likes.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((ev) => (
            <div
              key={ev.title}
              className="bg-steel rounded-2xl p-6 hover:border hover:border-ember/30 transition-all group"
            >
              <div className="text-3xl mb-4">{ev.icon}</div>
              <div className="font-label text-xs text-ember uppercase tracking-widest mb-2">
                {ev.tag}
              </div>
              <h3 className="font-display text-2xl text-chrome mb-3">{ev.title}</h3>
              <p className="font-body text-chrome/50 text-sm leading-relaxed">{ev.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
