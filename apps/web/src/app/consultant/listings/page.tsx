import Link from "next/link";
import { getServerUser } from "@/lib/auth.server";
import { listListings } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { CompleteSaleButton } from "./complete-sale-button";
import { UnpublishButton } from "./unpublish-button";
import { ResubmitButton } from "./resubmit-button";
import type { Listing } from "@/lib/types";

type Tab = "active" | "sold" | "rejected";

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Aktif" },
  { id: "sold", label: "Satıldı" },
  { id: "rejected", label: "Reddedildi / Kaldırıldı" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 100];

function filterByTab(listings: Listing[], tab: Tab): Listing[] {
  switch (tab) {
    case "active":
      return listings.filter(
        (l) =>
          !l.isSold &&
          (l.status === "DRAFT" ||
            l.status === "PENDING_REVIEW" ||
            l.status === "NEEDS_CHANGES" ||
            l.status === "PUBLISHED")
      );
    case "sold":
      return listings.filter((l) => l.isSold === true);
    case "rejected":
      return listings.filter(
        (l) =>
          l.status === "ARCHIVED" ||
          (l.status === "UNPUBLISHED" && !l.isSold)
      );
  }
}

interface Props {
  searchParams: Promise<{ tab?: string; page?: string; limit?: string }>;
}

function buildUrl(base: Record<string, string>, overrides: Record<string, string>) {
  const merged = { ...base, ...overrides };
  const qs = new URLSearchParams();
  if (merged.tab && merged.tab !== "active") qs.set("tab", merged.tab);
  if (merged.page && merged.page !== "1") qs.set("page", merged.page);
  if (merged.limit && merged.limit !== "20") qs.set("limit", merged.limit);
  const q = qs.toString();
  return `/consultant/listings${q ? `?${q}` : ""}`;
}

export default async function ConsultantListingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeTab: Tab =
    sp.tab === "sold" || sp.tab === "rejected" ? sp.tab : "active";
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(sp.limit))
    ? Number(sp.limit)
    : 10;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  let allListings: Listing[] = [];
  let fetchError: string | null = null;

  const serverUser = await getServerUser();
  const myId = serverUser?.sub ?? null;

  try {
    // Filter by consultantId server-side so we stay within the backend's
    // max limit of 100. Consultants with >100 listings are an edge case;
    // if needed, multi-page fetching can be added later.
    const result = await listListings({
      consultantId: myId ?? undefined,
      limit: 100,
      sortBy: "newest",
    });
    allListings = result.data;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Sunucuya ulaşılamıyor.";
  }

  const tabFiltered = filterByTab(allListings, activeTab);

  // Server-side pagination over the tab-filtered results
  const total = tabFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const listings = tabFiltered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const counts = {
    active: filterByTab(allListings, "active").length,
    sold: filterByTab(allListings, "sold").length,
    rejected: filterByTab(allListings, "rejected").length,
  };

  const urlBase = {
    tab: activeTab,
    page: String(safePage),
    limit: String(pageSize),
  };

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

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={buildUrl(urlBase, { tab: t.id, page: "1" })}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === t.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {counts[t.id]}
            </span>
          </Link>
        ))}
      </div>

      {fetchError ? (
        <ApiErrorMessage error={fetchError} />
      ) : listings.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {activeTab === "active"
              ? "Aktif ilanınız bulunmuyor."
              : activeTab === "sold"
              ? "Satılan ilanınız bulunmuyor."
              : "Reddedilen veya kaldırılan ilanınız bulunmuyor."}
          </p>
          {activeTab === "active" && (
            <Link
              href="/consultant/listings/new"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              İlk ilanınızı oluşturun
            </Link>
          )}
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
                    {listing.status === "PUBLISHED" && (
                      <div className="inline-flex flex-wrap gap-1.5 justify-end">
                        <UnpublishButton listingId={listing.id} />
                        <CompleteSaleButton listingId={listing.id} />
                      </div>
                    )}
                    {listing.status === "UNPUBLISHED" && !listing.isSold && (
                      <ResubmitButton listingId={listing.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              {total} ilan · Sayfa {safePage} / {totalPages}
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-xs">Sayfa başına:</span>
            <div className="flex gap-1">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <Link
                  key={n}
                  href={buildUrl(urlBase, { limit: String(n), page: "1" })}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    n === pageSize
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {n}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {safePage > 1 && (
              <Link
                href={buildUrl(urlBase, { page: String(safePage - 1) })}
                className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
              >
                ← Önceki
              </Link>
            )}
            {safePage < totalPages && (
              <Link
                href={buildUrl(urlBase, { page: String(safePage + 1) })}
                className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
              >
                Sonraki →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
