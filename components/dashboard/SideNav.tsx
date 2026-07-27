"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  CalendarPlus,
  Wrench,
  ShoppingCart,
  Package,
  Car,
  GraduationCap,
  User,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  adminOnly?: boolean;
};

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/commander", label: "Commander AI", icon: Sparkles, adminOnly: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/book", label: "Book a Bay", icon: CalendarPlus },
      { href: "/dashboard/garage", label: "My Garage", icon: Car },
      { href: "/dashboard/tools", label: "Tool Inventory", icon: Wrench },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/dashboard/parts", label: "Parts Store", icon: ShoppingCart },
      { href: "/dashboard/orders", label: "My Orders", icon: Package },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/dashboard/academy", label: "DIY Academy", icon: GraduationCap },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile & Settings", icon: User },
    ],
  },
];

export default function SideNav({ role }: { role: string }) {
  const pathname = usePathname();

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-carbon border-r border-steel flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-steel flex-shrink-0">
        <div className="w-7 h-7 bg-ember rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-display text-sm font-bold">D</span>
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm text-chrome tracking-wide leading-none">DRIVEDIY</p>
          <p className="font-label text-[9px] text-chrome/30 uppercase tracking-widest leading-none mt-0.5 truncate">
            Al Quoz, Dubai
          </p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map((group) => {
          const visible = group.items.filter(
            (item) => !item.adminOnly || role === "admin"
          );
          if (visible.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="font-label text-[9px] text-chrome/25 uppercase tracking-widest px-2 mb-1.5">
                {group.label}
              </p>
              {visible.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all mb-0.5 group ${
                      active
                        ? "bg-ember/10 text-ember"
                        : "text-chrome/40 hover:text-chrome hover:bg-steel/40"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-body flex-1">{item.label}</span>
                    {active && <div className="w-1 h-3.5 bg-ember rounded-full flex-shrink-0" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-steel px-4 py-3 flex-shrink-0">
        <p className="font-label text-[9px] text-chrome/20 uppercase tracking-widest">
          © 2025 DriveDIY · Proprietary
        </p>
      </div>
    </aside>
  );
}
