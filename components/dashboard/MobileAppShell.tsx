"use client";

import { useState, useEffect } from "react";
import HomeScreen from "./screens/HomeScreen";
import BookBayScreen from "./screens/BookBayScreen";
import MyGarageScreen from "./screens/MyGarageScreen";
import AcademyScreen from "./screens/AcademyScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PartsScreen from "./screens/PartsScreen";
import type { User, Booking, Vehicle } from "@/types/database";

type Screen = "home" | "book" | "garage" | "academy" | "profile" | "shop";

const NAV = [
  { id: "home" as Screen, label: "Home", icon: "⚡" },
  { id: "book" as Screen, label: "Book", icon: "🏗️" },
  { id: "garage" as Screen, label: "Garage", icon: "🚗" },
  { id: "academy" as Screen, label: "Learn", icon: "🎓" },
  { id: "shop" as Screen, label: "Shop", icon: "🛒" },
  { id: "profile" as Screen, label: "Profile", icon: "👤" },
];

interface Props {
  user: Partial<User> & { id: string; email: string };
  bookings: (Booking & { bays?: { name: string } | null })[];
  vehicles: Vehicle[];
  paymentResult?: "success";
}

export default function MobileAppShell({ user, bookings, vehicles, paymentResult }: Props) {
  const [screen, setScreen] = useState<Screen>("home");
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(paymentResult === "success");

  useEffect(() => {
    if (!showPaymentSuccess) return;
    const timer = setTimeout(() => setShowPaymentSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showPaymentSuccess]);

  const nextBooking = bookings.find(
    (b) => b.status === "confirmed" || b.status === "pending"
  );

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center p-4 md:p-8">
      {/* Phone shell */}
      <div
        className="relative bg-carbon rounded-[44px] border-2 border-steel shadow-2xl overflow-hidden flex flex-col"
        style={{ width: 390, height: 844, flexShrink: 0 }}
      >
        {/* Status bar */}
        <div className="flex-shrink-0 h-12 bg-midnight/80 flex items-center justify-between px-8 text-xs font-label text-chrome/60">
          <span>9:41</span>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-8 bg-midnight rounded-b-2xl flex items-center justify-center">
            <div className="w-12 h-1.5 bg-steel/50 rounded-full" />
          </div>
          <span>●●● 100%</span>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-y-auto bg-carbon">
          {screen === "home" && (
            <HomeScreen user={user} nextBooking={nextBooking} />
          )}
          {screen === "book" && <BookBayScreen userId={user.id} />}
          {screen === "garage" && (
            <MyGarageScreen vehicles={vehicles} userId={user.id} />
          )}
          {screen === "academy" && <AcademyScreen />}
          {screen === "shop" && <PartsScreen />}
          {screen === "profile" && (
            <ProfileScreen user={user} bookings={bookings} />
          )}
        </div>

        {/* Bottom navigation */}
        <div className="flex-shrink-0 h-20 bg-steel/80 backdrop-blur border-t border-midnight/50 flex items-center safe-area-bottom">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-all ${
                screen === item.id ? "text-ember" : "text-chrome/40"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-[9px] font-label uppercase tracking-wider">
                {item.label}
              </span>
              {screen === item.id && (
                <div className="w-4 h-0.5 bg-ember rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Payment success overlay */}
        {showPaymentSuccess && (
          <button
            onClick={() => setShowPaymentSuccess(false)}
            className="absolute inset-0 bg-midnight/95 flex flex-col items-center justify-center gap-4 z-40"
          >
            <div className="text-6xl">✅</div>
            <h2 className="font-display text-3xl text-chrome">Payment Done!</h2>
            <p className="font-body text-sm text-chrome/50 text-center px-8">
              Your booking is confirmed. Check your email for details.
            </p>
            <p className="font-label text-xs text-chrome/30 uppercase tracking-widest mt-4">
              Tap to dismiss
            </p>
          </button>
        )}
      </div>
    </div>
  );
}
