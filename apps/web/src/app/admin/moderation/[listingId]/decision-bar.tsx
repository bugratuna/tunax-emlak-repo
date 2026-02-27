"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/confirm-modal";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ApiRequestError } from "@/lib/api/client";
import {
  approveListing,
  requestChanges,
  rejectListing,
} from "@/lib/api/moderation";

type ActionType = "approve" | "request-changes" | "reject" | null;

export function DecisionBar({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [action, setAction] = useState<ActionType>(null);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setLoading(true);
    try {
      if (action === "approve") {
        await approveListing(listingId, undefined, notes || undefined);
      } else if (action === "request-changes") {
        await requestChanges(listingId, feedback);
      } else if (action === "reject") {
        await rejectListing(listingId, reason || undefined);
      }
      setDone(true);
      setAction(null);
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

  if (done) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        Decision recorded. Refresh the page to see the updated status.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-3">
          <ApiErrorMessage error={error} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setAction("approve")}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Approve
        </button>
        <button
          onClick={() => setAction("request-changes")}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          Request Changes
        </button>
        <button
          onClick={() => setAction("reject")}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Reject
        </button>
      </div>

      {/* Approve modal */}
      <ConfirmModal
        open={action === "approve"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Approve listing"
        description="This will publish the listing to the live site."
        confirmLabel="Approve"
        onConfirm={handleConfirm}
        loading={loading}
      >
        <label className="block text-sm font-medium text-zinc-700">
          Notes (optional)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes to record with this approval…"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </ConfirmModal>

      {/* Request changes modal */}
      <ConfirmModal
        open={action === "request-changes"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Request changes"
        description="The listing will be returned to the consultant with your feedback."
        confirmLabel="Send feedback"
        onConfirm={handleConfirm}
        loading={loading || !feedback.trim()}
      >
        <label className="block text-sm font-medium text-zinc-700">
          Feedback <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Describe what the consultant must change before resubmitting…"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        {feedback.trim() === "" && (
          <p className="mt-1 text-xs text-red-600">
            Feedback is required for this action.
          </p>
        )}
      </ConfirmModal>

      {/* Reject modal */}
      <ConfirmModal
        open={action === "reject"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Reject listing"
        description="This is a permanent action. The listing will be archived and cannot be reinstated."
        confirmLabel="Reject permanently"
        confirmVariant="destructive"
        onConfirm={handleConfirm}
        loading={loading}
      >
        <label className="block text-sm font-medium text-zinc-700">
          Reason (optional)
        </label>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection…"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </ConfirmModal>
    </>
  );
}
