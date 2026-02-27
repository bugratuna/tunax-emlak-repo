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
        setError("Sunucuya ulaşılamıyor.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        Karar kaydedildi. Güncellenmiş durumu görmek için sayfayı yenileyin.
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
          Onayla
        </button>
        <button
          onClick={() => setAction("request-changes")}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
        >
          Değişiklik İste
        </button>
        <button
          onClick={() => setAction("reject")}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Reddet
        </button>
      </div>

      {/* Onay modalı */}
      <ConfirmModal
        open={action === "approve"}
        onOpenChange={(o) => !o && setAction(null)}
        title="İlanı onayla"
        description="Bu işlem ilanı yayınlar ve ziyaretçilere görünür hale getirir."
        confirmLabel="Onayla"
        onConfirm={handleConfirm}
        loading={loading}
      >
        <label className="block text-sm font-medium text-zinc-700">
          Notlar (isteğe bağlı)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Bu onaya eklemek istediğiniz notlar…"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </ConfirmModal>

      {/* Değişiklik iste modalı */}
      <ConfirmModal
        open={action === "request-changes"}
        onOpenChange={(o) => !o && setAction(null)}
        title="Değişiklik iste"
        description="İlan, geri bildiriminizle birlikte danışmana iade edilecek."
        confirmLabel="Geri bildirim gönder"
        onConfirm={handleConfirm}
        loading={loading || !feedback.trim()}
      >
        <label className="block text-sm font-medium text-zinc-700">
          Geri bildirim <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Danışmanın yeniden göndermeden önce yapması gereken değişiklikleri açıklayın…"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        {feedback.trim() === "" && (
          <p className="mt-1 text-xs text-red-600">
            Bu işlem için geri bildirim zorunludur.
          </p>
        )}
      </ConfirmModal>

      {/* Reddet modalı */}
      <ConfirmModal
        open={action === "reject"}
        onOpenChange={(o) => !o && setAction(null)}
        title="İlanı reddet"
        description="Bu işlem kalıcıdır. İlan arşivlenir ve geri alınamaz."
        confirmLabel="Kalıcı olarak reddet"
        confirmVariant="destructive"
        onConfirm={handleConfirm}
        loading={loading}
      >
        <label className="block text-sm font-medium text-zinc-700">
          Red gerekçesi (isteğe bağlı)
        </label>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reddetme gerekçesi…"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </ConfirmModal>
    </>
  );
}
