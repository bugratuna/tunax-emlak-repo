"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { setShowcaseListing } from "@/lib/api/listings";

interface ShowcaseToggleProps {
  listingId: string;
  isShowcase: boolean;
}

export function ShowcaseToggle({ listingId, isShowcase: initial }: ShowcaseToggleProps) {
  const router = useRouter();
  const [showcase, setShowcase] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      await setShowcaseListing(listingId, !showcase);
      setShowcase((v) => !v);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Vitrin durumu güncellenemedi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          showcase
            ? "border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <Sparkles
          size={15}
          fill={showcase ? "currentColor" : "none"}
          className={showcase ? "text-purple-500" : "text-zinc-400"}
        />
        {loading
          ? "Güncelleniyor…"
          : showcase
          ? "Vitrin — Kaldır"
          : "Vitrin'e Ekle"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
