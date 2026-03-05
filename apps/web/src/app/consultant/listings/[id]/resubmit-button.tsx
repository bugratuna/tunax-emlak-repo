"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resubmitListing } from "@/lib/api/listings";
import { ApiErrorMessage } from "@/components/api-error-message";
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
        setError(`Hata ${err.status}: ${msg}`);
      } else {
        setError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <ApiErrorMessage error={error} />}
      <button
        onClick={handleResubmit}
        disabled={loading}
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
      >
        {loading ? "Gönderiliyor…" : "Yeniden Gönder"}
      </button>
    </div>
  );
}
