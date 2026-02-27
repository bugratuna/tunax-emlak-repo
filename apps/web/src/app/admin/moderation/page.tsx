import Link from "next/link";
import { getModerationQueue } from "@/lib/api/moderation";
import { ApiErrorMessage } from "@/components/api-error-message";
import type { Listing } from "@/lib/types";

export default async function ModerationQueuePage() {
  let items: Listing[] = [];
  let count = 0;
  let fetchError: string | null = null;

  try {
    const queue = await getModerationQueue();
    items = queue.items;
    count = queue.count;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unable to load queue.";
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">
            Moderation Queue
          </h1>
          <p className="text-sm text-zinc-500">
            Listings awaiting review
          </p>
        </div>
        {!fetchError && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
            {count} pending
          </span>
        )}
      </div>

      {fetchError ? (
        <ApiErrorMessage error={fetchError} />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No listings pending review.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Consultant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {listing.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {listing.consultantId}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(listing.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/moderation/${listing.id}`}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
