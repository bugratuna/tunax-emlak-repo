import { getServerToken } from "@/lib/auth.server";
import { apiFetch } from "@/lib/api/client";
import { ApiErrorMessage } from "@/components/api-error-message";
import { QueueContent } from "./queue-content";
import type { Listing, ListAllResult, ModerationQueue } from "@/lib/types";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ModerationQueuePage({ searchParams }: Props) {
  const { status: rawStatus } = await searchParams;
  const currentStatus =
    rawStatus === "NEEDS_CHANGES" ? "NEEDS_CHANGES" : "PENDING_REVIEW";

  let items: Listing[] = [];
  let total = 0;
  let fetchError: string | null = null;

  try {
    const token = await getServerToken();
    if (currentStatus === "NEEDS_CHANGES") {
      const result = await apiFetch<ListAllResult>(
        "/api/listings?status=NEEDS_CHANGES&sortBy=newest&limit=100",
        token ? { _token: token } : undefined,
      );
      items = result.data;
      total = result.total;
    } else {
      const queue = await apiFetch<ModerationQueue>(
        "/api/admin/moderation/queue",
        token ? { _token: token } : undefined,
      );
      items = queue.items;
      total = queue.count;
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Kuyruk yüklenemedi.";
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900">Onay Kuyruğu</h1>
        <p className="text-sm text-zinc-500">
          İnceleme ve değişiklik bekleyen ilanlar
        </p>
      </div>

      {fetchError ? (
        <ApiErrorMessage error={fetchError} />
      ) : (
        <QueueContent
          items={items}
          total={total}
          currentStatus={currentStatus}
        />
      )}
    </div>
  );
}
