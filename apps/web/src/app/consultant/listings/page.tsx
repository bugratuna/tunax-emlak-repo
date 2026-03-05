import Link from "next/link";
import { getServerUser } from "@/lib/auth.server";
import { listListings } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { ResubmitButton } from "./resubmit-button";
import type { Listing } from "@/lib/types";

export default async function ConsultantListingsPage() {
  let listings: Listing[] = [];
  let fetchError: string | null = null;

  // G-2: Backend has no consultantId filter; read sub from JWT cookie to filter client-side.
  const serverUser = await getServerUser();
  const myId = serverUser?.sub ?? null;

  try {
    const result = await listListings();
    listings = result.data;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Sunucuya ulaşılamıyor.";
  }

  // G-2: Show only this consultant's listings.
  if (myId) {
    listings = listings.filter((l) => l.consultantId === myId);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">İlanlarım</h1>
          <p className="text-sm text-zinc-500">Emlak ilanlarınızı yönetin</p>
        </div>
        <Link
          href="/consultant/listings/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Yeni İlan
        </Link>
      </div>

      {fetchError ? (
        <ApiErrorMessage error={fetchError} />
      ) : listings.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">Henüz ilanınız bulunmuyor.</p>
          <Link
            href="/consultant/listings/new"
            className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            İlk ilanınızı oluşturun
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Başlık
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Gönderim Tarihi
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {listing.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {listing.submittedAt ? listing.submittedAt.slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/consultant/listings/${listing.id}`}
                      className="mr-2 text-zinc-600 underline hover:text-zinc-900"
                    >
                      Görüntüle
                    </Link>
                    {(listing.status === "DRAFT" ||
                      listing.status === "NEEDS_CHANGES") && (
                      <Link
                        href={`/consultant/listings/${listing.id}/edit`}
                        className="mr-2 inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
                      >
                        Düzenle
                      </Link>
                    )}
                    {listing.status === "NEEDS_CHANGES" && (
                      <ResubmitButton listingId={listing.id} />
                    )}
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
