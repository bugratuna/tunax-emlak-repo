"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

// ── Storage key + consent shape ───────────────────────────────────────────────

const STORAGE_KEY = "tunax_cookie_consent_v1";

export interface CookieConsent {
  essential: true; // always on
  analytics: boolean;
  preferences: boolean;
  decidedAt: string;
}

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean, preferences: boolean) {
  const consent: CookieConsent = {
    essential: true,
    analytics,
    preferences,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  return consent;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [prefs, setPrefs] = useState(false);

  useEffect(() => {
    // Show banner only if no decision has been made yet
    if (!getStoredConsent()) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  function acceptAll() {
    saveConsent(true, true);
    setVisible(false);
  }

  function rejectAll() {
    saveConsent(false, false);
    setVisible(false);
  }

  function saveSelected() {
    saveConsent(analytics, prefs);
    setVisible(false);
  }

  return (
    <>
      {/* Backdrop overlay when preferences panel is open */}
      {showPrefs && (
        <div
          className="fixed inset-0 z-[59] bg-black/20 backdrop-blur-sm"
          onClick={() => setShowPrefs(false)}
        />
      )}

      {/* Main banner */}
      <div
        role="dialog"
        aria-label="Çerez tercihleri"
        aria-modal="false"
        className="fixed bottom-0 left-0 right-0 z-[60] border-t border-zinc-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md"
        style={{ animation: "slideUp 320ms cubic-bezier(0.4,0,0.2,1) both" }}
      >
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Preferences panel (expanded) */}
          {showPrefs ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-sm font-semibold text-zinc-900">
                  Çerez Tercihleriniz
                </h2>
                <button
                  onClick={() => setShowPrefs(false)}
                  className="text-zinc-400 hover:text-zinc-700 transition-colors"
                  aria-label="Kapat"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {/* Essential — always on */}
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-800">Zorunlu</span>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-white">
                      Her zaman aktif
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Oturum yönetimi ve güvenlik için gereklidir. Devre dışı bırakılamaz.
                  </p>
                </div>

                {/* Analytics */}
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-800">Analitik</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                      />
                      <div
                        className={`h-5 w-9 rounded-full transition-colors ${
                          analytics ? "bg-zinc-800" : "bg-zinc-300"
                        }`}
                      />
                      <div
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          analytics ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Site kullanım istatistikleri. Anonim verilerle hizmetimizi geliştirmemize yardımcı olur.
                  </p>
                </div>

                {/* Preferences */}
                <div className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-800">Tercihler</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={prefs}
                        onChange={(e) => setPrefs(e.target.checked)}
                      />
                      <div
                        className={`h-5 w-9 rounded-full transition-colors ${
                          prefs ? "bg-zinc-800" : "bg-zinc-300"
                        }`}
                      />
                      <div
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          prefs ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Dil, tema ve görüntüleme tercihlerinizi hatırlar.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={saveSelected}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  Seçimi Kaydet
                </button>
                <button
                  onClick={acceptAll}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  Tümünü Kabul Et
                </button>
                <Link
                  href="/legal/cerez"
                  className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
                >
                  Çerez Politikası
                </Link>
              </div>
            </div>
          ) : (
            /* Compact banner */
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600 max-w-2xl">
                Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Zorunlu çerezler
                her zaman aktiftir.{" "}
                <Link
                  href="/legal/cerez"
                  className="text-amber-700 hover:underline font-medium"
                >
                  Çerez Politikası
                </Link>
                {" "}ve{" "}
                <Link
                  href="/legal/kvkk"
                  className="text-amber-700 hover:underline font-medium"
                >
                  KVKK Metni
                </Link>
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setShowPrefs(true)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  Tercihler
                </button>
                <button
                  onClick={rejectAll}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  Reddet
                </button>
                <button
                  onClick={acceptAll}
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors"
                >
                  Tümünü Kabul Et
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
