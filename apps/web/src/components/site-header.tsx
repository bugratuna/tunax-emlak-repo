"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu, X, Phone, ChevronDown, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getMe } from "@/lib/api/users";
import type { UserProfile } from "@/lib/types";

const NAV_LINKS = [
  { href: "/listings", label: "İlanlar" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/services", label: "Hizmetler" },
  { href: "/vision", label: "Vizyon & Misyon" },
  { href: "/contact", label: "İletişim" },
];

const CONSULTANT_MENU = [
  { href: "/profile", label: "Profil Ayarları" },
  { href: "/consultant/listings", label: "İlanlarım" },
];

const ADMIN_MENU = [
  { href: "/profile", label: "Profil Ayarları" },
  { href: "/admin/listings", label: "İlanlar" },
  { href: "/admin/moderation", label: "Moderasyon" },
  { href: "/admin/users", label: "Kullanıcılar" },
];

/** Returns the best 1–2 character initials we can derive from profile or email. */
function getInitials(profile: UserProfile | null, email: string): string {
  if (profile) {
    const first = profile.firstName?.trim();
    const last = profile.lastName?.trim();
    if (first && last) return (first[0] + last[0]).toUpperCase();
    const name = profile.name?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
  }
  return email.slice(0, 2).toUpperCase();
}

/** Returns the display name for the trigger chip and dropdown header. */
function getDisplayName(profile: UserProfile | null, email: string): string {
  if (profile) {
    const first = profile.firstName?.trim();
    const last = profile.lastName?.trim();
    if (first && last) return `${first} ${last}`;
    const name = profile.name?.trim();
    if (name) return name;
  }
  return email.split("@")[0];
}

interface AccountDropdownProps {
  profile: UserProfile | null;
}

function AccountDropdown({ profile }: AccountDropdownProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const menuItems = user.role === "ADMIN" ? ADMIN_MENU : CONSULTANT_MENU;
  const initials = getInitials(profile, user.email);
  const displayName = getDisplayName(profile, user.email);
  const roleLabel = user.role === "ADMIN" ? "Yönetici" : "Danışman";

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger chip ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white pl-1 pr-3 py-1 text-sm font-medium text-zinc-800 shadow-sm hover:border-zinc-300 hover:shadow transition-all"
      >
        {/* Avatar circle */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white select-none">
          {initials}
        </span>
        {/* Name */}
        <span className="hidden lg:block max-w-32 truncate text-xs">
          {displayName}
        </span>
        <ChevronDown
          size={13}
          className={`text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white shadow-xl z-[1000] overflow-hidden">
          {/* User info header */}
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white select-none">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
              <p className="text-xs text-zinc-400">{roleLabel}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                {i === 0 && <Settings size={14} className="text-zinc-400" />}
                {i !== 0 && <span className="w-3.5" />}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-zinc-100 py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Fetch profile once when user is authenticated
  useEffect(() => {
    if (!user) return;
    getMe().then(setProfile).catch(() => {/* non-fatal */});
  }, [user]);

  const mobileMenuItems = user
    ? user.role === "ADMIN"
      ? ADMIN_MENU
      : CONSULTANT_MENU
    : [];

  return (
    // will-change-transform promotes the sticky element to a GPU compositor layer,
    // preventing the CPU-repaint jitter caused by backdrop-blur on scroll.
    <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 shadow-sm backdrop-blur will-change-transform">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/brand/logo.png"
            alt="Realty Tunax Logo"
            width={48}
            height={48}
            className="rounded-md object-contain"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight text-zinc-900">
              Realty Tunax
            </p>
            <p className="text-xs text-zinc-500 leading-tight">
              Antalya Gayrimenkul
            </p>
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
            <AccountDropdown profile={profile} />
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
            <div className="mt-2 border-t border-zinc-100 pt-2 space-y-1">
              {user ? (
                <>
                  {/* Mobile user identity row */}
                  <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 mb-1">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white select-none">
                      {getInitials(profile, user.email)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {getDisplayName(profile, user.email)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {user.role === "ADMIN" ? "Yönetici" : "Danışman"}
                      </p>
                    </div>
                  </div>
                  {mobileMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    Çıkış Yap
                  </button>
                </>
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
