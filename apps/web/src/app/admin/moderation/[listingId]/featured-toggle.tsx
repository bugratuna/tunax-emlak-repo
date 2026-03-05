"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { setFeaturedListing } from "@/lib/api/listings";

interface FeaturedToggleProps {
  listingId: string;
  isFeatured: boolean;
}

export function FeaturedToggle({ listingId, isFeatured: initial }: FeaturedToggleProps) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setError(null);
    try {
      await setFeaturedListing(listingId, !featured);
      setFeatured((f) => !f);
      router.refresh();
    } catch {
      setError("Öne çıkan durumu güncellenemedi.");
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
          featured
            ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <Star
          size={15}
          fill={featured ? "currentColor" : "none"}
          className={featured ? "text-amber-500" : "text-zinc-400"}
        />
        {loading
          ? "Güncelleniyor…"
          : featured
          ? "Öne Çıkan — Kaldır"
          : "Öne Çıkan Olarak İşaretle"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
