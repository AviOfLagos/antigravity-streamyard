import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Mail, Palette, Home } from "lucide-react";

import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/admin";

export const metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Overview", icon: Home },
  { href: "/admin/beta-requests", label: "Beta Requests", icon: Mail },
  { href: "/admin/marketing-kit", label: "Marketing Kit", icon: Palette },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();
  if (!result.ok) {
    redirect(result.reason === "forbidden" ? "/adminos" : "/adminos");
  }
  const email = result.email;

  return (
    <div className="min-h-screen bg-surface text-white flex flex-col">
      <header className="border-b border-white/8 bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center text-white font-black text-sm">
                Z
              </div>
              <span className="font-bold text-sm tracking-tight">
                zerocast<span className="text-brand-soft">/admin</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-ink-muted hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Icon size={13} />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/adminos" });
            }}
            className="flex items-center gap-3"
          >
            <span className="text-xs text-ink-faint font-mono hidden sm:block">
              {email}
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-ink-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
