"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const NAV_LINKS = [
  { href: "/listings", label: "İlanlar" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/services", label: "Hizmetler" },
  { href: "/vision", label: "Vizyon & Misyon" },
  { href: "/contact", label: "İletişim" },
];

export function SiteHeader() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/brand/logo.png"
            alt="AREP Logo"
            width={48}
            height={48}
            className="rounded-md object-contain"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-zinc-900">AREP</p>
            <p className="text-xs text-zinc-500 leading-tight">Antalya Gayrimenkul</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-6 text-sm font-medium text-zinc-600">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-zinc-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3 text-sm">
          <a
            href="tel:+902420000000"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <Phone size={14} />
            <span className="text-xs">+90 553 084 22 70</span>
          </a>
          {user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin/moderation" : "/consultant/listings"}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Panel
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors"
            >
              Danışman Girişi
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-zinc-600"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menüyü aç/kapat"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-zinc-100 pt-2">
              {user ? (
                <Link
                  href={user.role === "ADMIN" ? "/admin/moderation" : "/consultant/listings"}
                  className="block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Panel
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Danışman Girişi
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
