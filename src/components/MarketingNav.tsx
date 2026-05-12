"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, Suspense } from "react";
import { Zap, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/integrations", label: "Integrations" },
  { href: "/compare/streamyard-alternative", label: "Compare" },
  { href: "/blog", label: "Blog" },
];

function NavContent() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#080808]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">Zerocast</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-white"
                  : "text-neutral-500 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="?beta=true"
            scroll={false}
            className="text-sm font-bold bg-white text-neutral-950 hover:bg-indigo-100 px-5 py-2 rounded-full transition-all"
          >
            Join Beta
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-neutral-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#080808] px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-neutral-400 hover:text-white text-sm font-medium transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
            <Link href="/login" className="text-sm text-neutral-400">Sign In</Link>
            <Link href="?beta=true" scroll={false} className="text-sm font-bold bg-white text-neutral-950 px-5 py-2.5 rounded-full text-center">
              Join Beta
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function MarketingNav() {
  return (
    <Suspense fallback={
      <nav className="sticky top-0 z-50 bg-[#080808]/80 backdrop-blur-md border-b border-white/5 h-16" />
    }>
      <NavContent />
    </Suspense>
  );
}
