"use client";

import { useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import BookBayScreen from "./screens/BookBayScreen";
import MyGarageScreen from "./screens/MyGarageScreen";
import AcademyScreen from "./screens/AcademyScreen";
import ProfileScreen from "./screens/ProfileScreen";
import type { User, Booking, Vehicle } from "@/types/database";

type Screen = "home" | "book" | "garage" | "academy" | "profile";

const NAV = [
  { id: "home" as Screen, label: "Home", icon: "⚡" },
  { id: "book" as Screen, label: "Book", icon: "🏗️" },
  { id: "garage" as Screen, label: "Garage", icon: "🚗" },
  { id: "academy" as Screen, label: "Learn", icon: "🎓" },
  { id: "profile" as Screen, label: "Profile", icon: "👤" },
];

interface Props {
  user: Partial<User> & { id: string; email: string };
  bookings: (Booking & { bays?: { name: string } | null })[];
  vehicles: Vehicle[];
  bookingState?: "success" | "cancelled";
}

export default function MobileAppShell({ user, bookings, vehicles, bookingState }: Props) {
  const [screen, setScreen] = useState<Screen>("home");

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
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-8 bg-midnight rounded-b-2xl flex items-center justify-center">
            <div className="w-12 h-1.5 bg-steel/50 rounded-full" />
          </div>
          <span>●●● 100%</span>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-y-auto bg-carbon">
          {screen === "home" && (
            <HomeScreen user={user} nextBooking={nextBooking} bookingState={bookingState} />
          )}
          {screen === "book" && <BookBayScreen userId={user.id} />}
          {screen === "garage" && (
            <MyGarageScreen vehicles={vehicles} userId={user.id} />
          )}
          {screen === "academy" && <AcademyScreen />}
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
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-label uppercase tracking-wider">
                {item.label}
              </span>
              {screen === item.id && (
                <div className="w-4 h-0.5 bg-ember rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
