"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, LogOut, ChevronDown, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import { getMe } from "@/lib/api/users";
import type { UserProfile } from "@/lib/types";

// ── Account dropdown helpers ───────────────────────────────────────────────────

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

function AccountDropdown({ profile }: { profile: UserProfile | null }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  if (!user) return null;

  const menuItems = user.role === "ADMIN" ? ADMIN_MENU : CONSULTANT_MENU;
  const displayName = getDisplayName(profile, user.email);
  const roleLabel = user.role === "ADMIN" ? "Yönetici" : "Danışman";

  // Profile photo if available
  const photoUrl = profile?.profilePhotoUrl ?? null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: open ? "#F0EDE8" : "transparent",
          border: "1px solid #E5E2DC",
          borderRadius: "999px",
          padding: "4px 12px 4px 6px",
          cursor: "pointer",
          transition: "background 150ms ease, border-color 150ms ease",
        }}
        onMouseEnter={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.background = "#F5F3EF";
        }}
        onMouseLeave={(e) => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
        }}
      >
        {/* Profile icon / photo */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={displayName}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <UserCircle2
            size={28}
            style={{ color: "#1A1A2E", flexShrink: 0 }}
          />
        )}
        {/* Name */}
        <span
          className="hidden lg:block"
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "#1A1A2E",
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </span>
        <ChevronDown
          size={13}
          style={{
            color: "#9B8E7E",
            transition: "transform 150ms ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "220px",
            background: "#FAFAF8",
            border: "1px solid #E5E2DC",
            borderRadius: "12px",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* User header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderBottom: "1px solid #EAE7E2",
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={displayName}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <UserCircle2
                size={36}
                style={{ color: "#1A1A2E", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0F0F1A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                {displayName}
              </p>
              <p style={{ fontSize: "11px", color: "#9B8E7E", margin: 0 }}>
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "4px 0" }}>
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 16px",
                    fontSize: "13px",
                    color: isActive ? "#0F0F1A" : "#3A3A4A",
                    background: isActive ? "#F0EDE8" : "transparent",
                    textDecoration: "none",
                    fontWeight: isActive ? 600 : 400,
                    transition: "background 120ms ease",
                    borderLeft: isActive
                      ? "3px solid #C9A96E"
                      : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "#F5F3EF";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLAnchorElement).style.background =
                        "transparent";
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div style={{ borderTop: "1px solid #EAE7E2", padding: "4px 0" }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "9px 16px",
                fontSize: "13px",
                color: "#C0392B",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 120ms ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#FEF2F2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <LogOut size={13} style={{ flexShrink: 0 }} />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── NavLink — gold underline hover animation ───────────────────────────────────

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rt-nav-link ${isActive ? "rt-nav-link-active" : ""}`}
    >
      {children}
    </Link>
  );
}

// ── CTA Button ─────────────────────────────────────────────────────────────────

function CtaButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-[6px] bg-[#1A1A2E] px-4.5 py-2.25 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#FAFAF8] shadow-[0_2px_12px_rgba(26,26,46,0.18)] transition-all duration-200 ease-out hover:bg-[#2E2E50] hover:shadow-[0_4px_20px_rgba(26,26,46,0.26)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

// ── MobileLink ────────────────────────────────────────────────────────────────

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#F5F0E8] text-[#0F0F1A]"
          : "text-[#6B6B7A] hover:bg-[#F5F3EF] hover:text-[#0F0F1A]"
      }`}
    >
      {children}
    </Link>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

export function Nav() {
  const { user } = useAuth();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile once when authenticated
  useEffect(() => {
    if (!user) return;
    getMe()
      .then(setProfile)
      .catch(() => {
        /* non-fatal */
      });
  }, [user]);

  // Sticky scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        searchInputRef.current &&
        !searchInputRef.current.closest("form")?.contains(target)
      ) {
        setSearchOpen(false);
        setSearchValue("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    router.push(`/listings?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchValue("");
  }

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setSearchOpen(false);
      setSearchValue("");
    }
  }

  const pathname = usePathname();
  const navLinks = [
    { href: "/listings", label: "İlanlar" },
    { href: "/team", label: "Ekibimiz" },
    { href: "/about", label: "Hakkımızda" },
    { href: "/contact", label: "İletişim" },
  ];

  return (
    <header
      className="sticky top-0 z-9999"
      style={{
        background: scrolled ? "rgba(250,250,248,0.96)" : "#FAFAF8",
        transition:
          "background 300ms ease, box-shadow 300ms ease, height 280ms ease",
        height: scrolled ? "60px" : "80px",
        boxShadow: scrolled ? "0 1px 0 0 rgba(229,226,220,0.8)" : "none",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
      }}
    >
      <div
        className="mx-auto flex h-full items-center justify-between"
        style={{ maxWidth: "1320px", padding: "0 40px" }}
      >
        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/brand/logo.png"
            alt="Realty Tunax"
            width={0}
            height={0}
            sizes="100vw"
            style={{
              height: scrolled ? "36px" : "48px",
              width: "auto",
              objectFit: "contain",
              transition: "height 300ms ease",
            }}
          />
        </Link>

        {/* ── Desktop nav ───────────────────────────────────────────────────── */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Ana navigasyon"
        >
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href}>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Right zone ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Expandable search */}
          <div className="relative flex items-center">
            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.form
                  key="search-form"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 260 }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
                  }
                  onSubmit={handleSearchSubmit}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={handleSearchKey}
                    placeholder="İlan No, başlık veya konum..."
                    style={{
                      width: "100%",
                      border: "none",
                      borderBottom: "1.5px solid #C9A96E",
                      background: "transparent",
                      paddingBottom: "4px",
                      fontSize: "13px",
                      color: "#0F0F1A",
                      outline: "none",
                    }}
                    className="placeholder:text-[#6B6B7A]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchValue("");
                    }}
                    className="text-[#6B6B7A] transition-colors hover:text-[#0F0F1A]"
                    aria-label="Aramayı kapat"
                  >
                    <X size={16} />
                  </button>
                </motion.form>
              ) : (
                <motion.button
                  key="search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setSearchOpen(true)}
                  className="text-[#6B6B7A] transition-all duration-150 hover:text-[#0F0F1A] hover:scale-110"
                  aria-label="Arama"
                  whileHover={shouldReduceMotion ? {} : { scale: 1.12 }}
                  whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                >
                  <Search size={19} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* CTA — login only for anonymous visitors, not on the login page itself */}
          {!user && pathname !== "/login" && <CtaButton href="/login">Giriş Yap</CtaButton>}

          {/* Account dropdown for authenticated users */}
          {user && <AccountDropdown profile={profile} />}

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden flex-col gap-1.25 p-1.5 rounded-md transition-colors hover:bg-[#F5F3EF]"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={menuOpen}
          >
            <motion.span
              className="block h-[1.5px] w-5 bg-[#1A1A2E] origin-center"
              animate={menuOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: "easeOut" }
              }
            />
            <motion.span
              className="block h-[1.5px] w-5 bg-[#1A1A2E]"
              animate={
                menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }
              }
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }
              }
            />
            <motion.span
              className="block h-[1.5px] w-5 bg-[#1A1A2E] origin-center"
              animate={
                menuOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: "easeOut" }
              }
            />
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
            }
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden border-t border-[#EAE7E2] bg-[#FAFAF8] px-4 py-3 space-y-1"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
          >
            {navLinks.map(({ href, label }, i) => (
              <motion.div
                key={href}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.18 }}
              >
                <MobileLink href={href} onClick={() => setMenuOpen(false)}>
                  {label}
                </MobileLink>
              </motion.div>
            ))}
            {user?.role === "CONSULTANT" && (
              <motion.div
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.04, duration: 0.18 }}
              >
                <MobileLink
                  href="/consultant/listings"
                  onClick={() => setMenuOpen(false)}
                >
                  İlanlarım
                </MobileLink>
              </motion.div>
            )}
            {user?.role === "ADMIN" && (
              <>
                {[
                  { href: "/admin/moderation", label: "Moderasyon" },
                  { href: "/admin/listings", label: "İlanlar" },
                  { href: "/admin/users", label: "Kullanıcılar" },
                ].map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: (navLinks.length + i) * 0.04,
                      duration: 0.18,
                    }}
                  >
                    <MobileLink href={href} onClick={() => setMenuOpen(false)}>
                      {label}
                    </MobileLink>
                  </motion.div>
                ))}
              </>
            )}

            {/* Social links in mobile menu */}
            <div className="pt-3 mt-2 border-t border-[#EAE7E2] flex items-center gap-3 px-1">
              <a
                href="https://www.instagram.com/tunax.gayrimenkul"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/reality.tunax.gayrimenkul"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors"
              >
                Facebook
              </a>
              <a
                href="sahibinden.ico"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors"
              >
                Sahibinden
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
