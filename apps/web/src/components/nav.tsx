"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function Nav() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          {/* Plain <img> preserves PNG transparency — no forced background from next/image */}
          <img
            src="/brand/logo.png"
            alt="Realty Tunax"
            className="h-9 w-auto object-contain"
          />
          <span className="font-semibold text-zinc-900 text-sm">Realty Tunax</span>
        </Link>

        <nav className="flex flex-1 items-center gap-5 text-sm text-zinc-600">
          <Link href="/listings" className="hover:text-zinc-900">
            İlanlar
          </Link>
          <Link href="/team" className="hidden sm:inline hover:text-zinc-900">
            Ekibimiz
          </Link>
          <Link href="/about" className="hidden sm:inline hover:text-zinc-900">
            Hakkımızda
          </Link>
          <Link href="/contact" className="hidden sm:inline hover:text-zinc-900">
            İletişim
          </Link>

          {user?.role === "CONSULTANT" && (
            <Link href="/consultant/listings" className="hover:text-zinc-900">
              İlanlarım
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link href="/admin/moderation" className="hover:text-zinc-900">
                Moderasyon
              </Link>
              <Link href="/admin/users" className="hover:text-zinc-900">
                Kullanıcılar
              </Link>
              <Link
                href="/admin/listings/new"
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
              >
                + Yeni İlan
              </Link>
            </>
          )}
        </nav>

        {/* Right side — user info + logout / login link */}
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span className="hidden sm:block text-zinc-500 text-xs">
                {user.email}{" "}
                <span className="ml-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {user.role === "ADMIN" ? "Yönetici" : "Danışman"}
                </span>
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              >
                <LogOut size={13} />
                Çıkış
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
            >
              Giriş Yap
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
