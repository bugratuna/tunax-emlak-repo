"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveUser, suspendUser } from "@/lib/api/users";
import type { AdminUser } from "@/lib/types";

export function UserActions({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handle(action: "approve" | "suspend") {
    setLoading(true);
    try {
      if (action === "approve") {
        await approveUser(user.id);
      } else {
        await suspendUser(user.id);
      }
      router.refresh();
    } catch {
      // silently fail — page will remain unchanged
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {user.status !== "ACTIVE" && (
        <button
          onClick={() => handle("approve")}
          disabled={loading}
          className="rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          Onayla
        </button>
      )}
      {user.status !== "SUSPENDED" && (
        <button
          onClick={() => handle("suspend")}
          disabled={loading}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Askıya Al
        </button>
      )}
    </div>
  );
}
