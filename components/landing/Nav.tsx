"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-midnight/95 backdrop-blur border-b border-steel" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-3xl text-chrome tracking-widest">
          DRIVE<span className="text-ember">DIY</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Services", "Pricing", "Academy", "Community"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="font-label text-xs text-chrome/60 hover:text-chrome tracking-widest uppercase transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="font-label text-xs text-chrome/60 hover:text-chrome tracking-widest uppercase transition-colors hidden md:block"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-ember hover:bg-race-red text-white font-label text-xs uppercase tracking-widest px-5 py-2.5 rounded-lg transition-colors"
          >
            Book a Bay
          </Link>
        </div>
      </div>
    </nav>
  );
}
