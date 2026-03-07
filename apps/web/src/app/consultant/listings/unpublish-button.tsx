"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unpublishListing } from "@/lib/api/listings";

interface Props {
  listingId: string;
  /** When true renders as a full-width block button instead of inline */
  block?: boolean;
}

export function UnpublishButton({ listingId, block = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (
      !window.confirm(
        "Bu ilanı yayından kaldırmak istediğinizden emin misiniz?\n\nİlan herkese açık listeden kaldırılacak. Daha sonra yeniden incelemeye gönderebilirsiniz.",
      )
    )
      return;

    setLoading(true);
    setError(null);
    try {
      await unpublishListing(listingId);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "İlan yayından kaldırılamadı.",
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
            ? "w-full rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
            : "rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        }
      >
        {loading ? "Kaldırılıyor…" : "Yayından Kaldır"}
      </button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
