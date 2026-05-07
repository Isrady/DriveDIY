import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-midnight border-t border-steel py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="font-display text-4xl text-chrome tracking-widest mb-3">
              DRIVE<span className="text-ember">DIY</span>
            </div>
            <p className="font-label text-xs text-chrome/30 uppercase tracking-widest mb-4">
              Your Bay. Your Tools. Your Build.
            </p>
            <p className="font-body text-chrome/40 text-sm leading-relaxed max-w-sm">
              Dubai&apos;s first DIY car servicing facility. Opening in Al Quoz.
              Professional bays, pro tools, your pace.
            </p>
          </div>

          <div>
            <p className="font-label text-xs text-chrome/30 uppercase tracking-widest mb-4">
              Services
            </p>
            <ul className="space-y-3">
              {["Bay Rental", "Tool Kits", "Parts", "DIY Academy", "Mechanic Assist"].map((s) => (
                <li key={s}>
                  <Link
                    href="/auth/signup"
                    className="font-body text-sm text-chrome/50 hover:text-chrome transition-colors"
                  >
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-label text-xs text-chrome/30 uppercase tracking-widest mb-4">
              Connect
            </p>
            <ul className="space-y-3">
              {[
                { label: "Instagram", href: "#" },
                { label: "TikTok", href: "#" },
                { label: "WhatsApp", href: "#" },
                { label: "Snapchat", href: "#" },
              ].map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="font-body text-sm text-chrome/50 hover:text-chrome transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-steel pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-label text-xs text-chrome/20 uppercase tracking-widest">
            © 2025 DriveDIY · Al Quoz, Dubai, UAE
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="font-label text-xs text-chrome/20 hover:text-chrome/50 uppercase tracking-widest transition-colors">
              Privacy
            </Link>
            <Link href="#" className="font-label text-xs text-chrome/20 hover:text-chrome/50 uppercase tracking-widest transition-colors">
              Terms
            </Link>
            <Link href="/auth/login" className="font-label text-xs text-chrome/20 hover:text-chrome/50 uppercase tracking-widest transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
