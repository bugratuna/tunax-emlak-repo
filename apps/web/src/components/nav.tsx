"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, X, LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

// ── NavLink — gold underline hover animation ───────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rt-nav-link ${isActive ? "rt-nav-link-active" : ""}`}
    >
      {children}
    </Link>
  );
}

// ── CTA Button ────────────────────────────────────────────────────────────────

function CtaButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-[6px] bg-[#1A1A2E] px-[18px] py-[9px] text-[12px] font-semibold uppercase tracking-[0.08em] text-[#FAFAF8] shadow-[0_2px_12px_rgba(26,26,46,0.20)] transition-all duration-[180ms] ease-out hover:bg-[#2E2E50] hover:shadow-[0_4px_20px_rgba(26,26,46,0.30)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98] whitespace-nowrap"
    >
      {children}
    </Link>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

export function Nav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sticky scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchOpen) {
      // Small delay so the CSS width transition plays first
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Close search on outside click
  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (searchInputRef.current && !searchInputRef.current.closest("form")?.contains(target)) {
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

  const navLinks = [
    { href: "/listings", label: "İlanlar" },
    { href: "/team", label: "Ekibimiz" },
    { href: "/about", label: "Hakkımızda" },
    { href: "/contact", label: "İletişim" },
  ];

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "#FAFAF8",
        height: scrolled ? "60px" : "80px",
        transition: "height 300ms ease, box-shadow 300ms ease",
        boxShadow: scrolled ? "0 1px 0 0 #E5E2DC" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        backgroundColor: scrolled ? "rgba(250,250,248,0.95)" : "#FAFAF8",
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

        {/* ── Desktop nav ────────────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <NavLink key={href} href={href}>
              {label}
            </NavLink>
          ))}
          {user?.role === "CONSULTANT" && (
            <NavLink href="/consultant/listings">İlanlarım</NavLink>
          )}
          {user?.role === "ADMIN" && (
            <>
              <NavLink href="/admin/moderation">Moderasyon</NavLink>
              <NavLink href="/admin/listings">İlanlar</NavLink>
              <NavLink href="/admin/users">Kullanıcılar</NavLink>
            </>
          )}
        </nav>

        {/* ── Right zone ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Expandable search */}
          <div className="relative flex items-center">
            {searchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2"
                style={{ animation: "searchExpand 250ms cubic-bezier(0.4,0,0.2,1) both" }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearchKey}
                  placeholder="İlan No, başlık veya konum..."
                  style={{
                    width: "260px",
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
                  onClick={() => { setSearchOpen(false); setSearchValue(""); }}
                  className="text-[#6B6B7A] transition-colors hover:text-[#0F0F1A]"
                  aria-label="Aramayı kapat"
                >
                  <X size={16} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-[#6B6B7A] transition-all duration-75 hover:text-[#0F0F1A] hover:scale-110"
                aria-label="Arama"
              >
                <Search size={19} />
              </button>
            )}
          </div>

          {/* CTA — admin: new listing, guest: login */}
          {user?.role === "ADMIN" && (
            <CtaButton href="/admin/listings/new">+ Yeni İlan</CtaButton>
          )}
          {!user && (
            <CtaButton href="/login">Giriş Yap</CtaButton>
          )}

          {/* Logged-in user info + logout */}
          {user && (
            <>
              <span className="hidden lg:block text-xs text-[#6B6B7A]">
                {user.email}{" "}
                <span className="ml-1 rounded-full bg-[#E8DFD0] px-2 py-0.5 text-[10px] font-medium text-[#1A1A2E]">
                  {user.role === "ADMIN" ? "Yönetici" : "Danışman"}
                </span>
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-md border border-[#E5E2DC] px-3 py-1.5 text-xs font-medium text-[#6B6B7A] transition-all hover:border-[#C9A96E] hover:text-[#0F0F1A]"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden flex-col gap-[5px] p-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menü"
          >
            <span
              className="block h-[1.5px] w-5 bg-[#1A1A2E] transition-all duration-200"
              style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }}
            />
            <span
              className="block h-[1.5px] w-5 bg-[#1A1A2E] transition-all duration-200"
              style={{ opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block h-[1.5px] w-5 bg-[#1A1A2E] transition-all duration-200"
              style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }}
            />
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown menu ───────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="md:hidden border-t border-[#E5E2DC] bg-[#FAFAF8] px-5 py-4 space-y-3"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors"
            >
              {label}
            </Link>
          ))}
          {user?.role === "CONSULTANT" && (
            <Link
              href="/consultant/listings"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors"
            >
              İlanlarım
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <>
              <Link href="/admin/moderation" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors">Moderasyon</Link>
              <Link href="/admin/listings" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors">İlanlar</Link>
              <Link href="/admin/users" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-[#6B6B7A] hover:text-[#0F0F1A] transition-colors">Kullanıcılar</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
