"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveUser, suspendUser, activateUser } from "@/lib/api/users";
import type { AdminUser } from "@/lib/types";

export function UserActions({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  async function handle(action: "approve" | "suspend" | "activate") {
    setLoading(true);
    setConfirmSuspend(false);
    try {
      if (action === "approve") await approveUser(user.id);
      else if (action === "suspend") await suspendUser(user.id);
      else await activateUser(user.id);
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {user.status === "PENDING_APPROVAL" && (
        <button
          onClick={() => handle("approve")}
          disabled={loading}
          className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          Onayla
        </button>
      )}

      {user.status === "SUSPENDED" && (
        <button
          onClick={() => handle("activate")}
          disabled={loading}
          className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          Aktive Et
        </button>
      )}

      {user.status === "ACTIVE" && !confirmSuspend && (
        <button
          onClick={() => setConfirmSuspend(true)}
          disabled={loading}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Askıya Al
        </button>
      )}
      {user.status === "ACTIVE" && confirmSuspend && (
        <>
          <button
            onClick={() => setConfirmSuspend(false)}
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => handle("suspend")}
            disabled={loading}
            className="rounded-md border border-red-400 bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            Evet, Askıya Al
          </button>
        </>
      )}
    </div>
  );
}
