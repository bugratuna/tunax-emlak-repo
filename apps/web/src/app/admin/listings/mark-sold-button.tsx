"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSaleStatus } from "@/lib/api/listings";

interface Props {
  listingId: string;
  isSold: boolean;
}

export function AdminMarkSoldButton({ listingId, isSold }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const action = isSold
      ? "Bu ilanı satılmadı olarak geri almak istediğinizden emin misiniz?"
      : "Bu ilanı satıldı olarak işaretlemek istediğinizden emin misiniz?";
    if (!window.confirm(action)) return;

    setLoading(true);
    setError(null);
    try {
      await setSaleStatus(listingId, !isSold);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          isSold
            ? "cursor-pointer rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-100 active:scale-[0.98] active:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            : "cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.98] active:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        }
      >
        {loading ? "…" : isSold ? "Satışı Geri Al" : "Satıldı İşaretle"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
