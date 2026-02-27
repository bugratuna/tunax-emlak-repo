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
        setError(`${err.status}: ${msg}`);
      } else {
        setError("Unable to reach server.");
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
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? "Resubmitting…" : "Resubmit for Review"}
      </button>
    </div>
  );
}
