"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resubmitListing } from "@/lib/api/listings";
import { ApiRequestError } from "@/lib/api/client";

export function ResubmitButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResubmit() {
    setError(null);
    setLoading(true);
    try {
      await resubmitListing(listingId);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const msg = Array.isArray(err.body.message)
          ? err.body.message.join(", ")
          : err.body.message;
        setError(`${err.status}: ${msg}`);
      } else {
        setError("Sunucuya ulaşılamıyor.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <span>
      <button
        type="button"
        onClick={handleResubmit}
        disabled={loading}
        className="cursor-pointer rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-amber-600 active:scale-[0.98] active:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        title={error ?? undefined}
      >
        {loading ? "Gönderiliyor…" : "Yeniden Gönder"}
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-600">{error}</span>
      )}
    </span>
  );
}
