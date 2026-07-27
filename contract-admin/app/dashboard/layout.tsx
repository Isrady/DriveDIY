import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "⊞" },
  { href: "/dashboard/contracts", label: "Contracts", icon: "📄" },
  { href: "/dashboard/correspondence", label: "Correspondence", icon: "✉" },
  { href: "/dashboard/actions", label: "Actions", icon: "✓" },
  { href: "/dashboard/risk-register", label: "Risk Register", icon: "⚠" },
  { href: "/dashboard/settings/email", label: "Settings", icon: "⚙" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-muted)]">
            Contract Admin
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
            {user.email}
          </p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--color-foreground)] hover:bg-[var(--color-border)] transition-colors"
            >
              <span className="w-4 text-center text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-[var(--color-border)]">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
