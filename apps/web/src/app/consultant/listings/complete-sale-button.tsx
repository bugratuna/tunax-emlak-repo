"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeSaleListing } from "@/lib/api/listings";

interface Props {
  listingId: string;
  /** When true renders as a full-width block button instead of inline */
  block?: boolean;
}

export function CompleteSaleButton({ listingId, block = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (
      !window.confirm(
        "Bu ilanı satıldı olarak işaretleyip yayından kaldırmak istediğinizden emin misiniz?\n\n" +
          "İlan herkese açık listeden kaldırılacak ve satış tamamlandı olarak kaydedilecek.",
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      await completeSaleListing(listingId);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "İşlem gerçekleştirilemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={block ? "space-y-2" : "inline-flex flex-col items-end gap-1"}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          block
            ? "w-full rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
            : "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        }
      >
        {loading ? "İşleniyor…" : "Satışı Tamamla & Yayından Kaldır"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
