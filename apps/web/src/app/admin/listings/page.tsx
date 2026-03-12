import Link from "next/link";
import { getServerToken } from "@/lib/auth.server";
import { adminListListings } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { AdminUnpublishButton } from "../moderation/[listingId]/unpublish-button";
import { AdminMarkSoldButton } from "./mark-sold-button";
import type { Listing, ListingStatus } from "@/lib/types";

export const metadata = { title: "Tüm İlanlar — Realty Tunax" };

type Tab = "active" | "sold" | "rejected";

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Aktif" },
  { id: "sold", label: "Satıldı" },
  { id: "rejected", label: "Reddedildi / Kaldırıldı" },
];

const PAGE_SIZE_OPTIONS = [12, 24, 100] as const;

interface SearchParams {
  tab?: string;
  status?: string;
  search?: string;
  page?: string;
  limit?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tüm Durumlar" },
  { value: "PUBLISHED", label: "Yayında" },
  { value: "PENDING_REVIEW", label: "İnceleme Bekliyor" },
  { value: "NEEDS_CHANGES", label: "Düzenleme Gerekiyor" },
  { value: "UNPUBLISHED", label: "Yayından Kaldırıldı" },
  { value: "ARCHIVED", label: "Arşivde" },
  { value: "DRAFT", label: "Taslak" },
];

function filterListingsByTab(listings: Listing[], tab: Tab): Listing[] {
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

export default async function AdminAllListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = await getServerToken();

  const activeTab: Tab =
    params.tab === "sold" || params.tab === "rejected" ? params.tab : "active";
  const status = params.status || undefined;
  const search = params.search || undefined;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(params.limit) as typeof PAGE_SIZE_OPTIONS[number])
    ? Number(params.limit)
    : 10;

  let allListings: Listing[] = [];
  let total = 0;
  let fetchError: string | null = null;

  try {
    const result = await adminListListings({ status, search, page, limit: pageSize }, token ?? undefined);
    allListings = result.data;
    total = result.total;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "İlanlar yüklenemedi.";
  }

  const listings = filterListingsByTab(allListings, activeTab);

  const counts = {
    active: filterListingsByTab(allListings, "active").length,
    sold: filterListingsByTab(allListings, "sold").length,
    rejected: filterListingsByTab(allListings, "rejected").length,
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(overrides: Partial<SearchParams>) {
    const merged = {
      tab: activeTab,
      status: status ?? "",
      search: search ?? "",
      page: String(page),
      limit: String(pageSize),
      ...overrides,
    };
    const qs = new URLSearchParams();
    if (merged.tab && merged.tab !== "active") qs.set("tab", merged.tab);
    if (merged.status) qs.set("status", merged.status);
    if (merged.search) qs.set("search", merged.search);
    if (merged.page && merged.page !== "1") qs.set("page", merged.page);
    if (merged.limit && merged.limit !== "20") qs.set("limit", merged.limit);
    const q = qs.toString();
    return `/admin/listings${q ? `?${q}` : ""}`;
  }

  const hasFilters = !!(status || search);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Tüm İlanlar</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} ilan bulundu</p>
        </div>
        <Link
          href="/admin/listings/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Yeni İlan
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={buildUrl({ tab: t.id, page: "1" })}
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

      {/* Filters */}
      <form method="GET" action="/admin/listings" className="flex flex-wrap gap-3">
        <input type="hidden" name="tab" value={activeTab} />
        <input
          type="text"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Başlık ara…"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-zinc-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Filtrele
        </button>
        {hasFilters && (
          <Link
            href={buildUrl({ status: "", search: "", page: "1" })}
            className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            Temizle
          </Link>
        )}
      </form>

      {fetchError && <ApiErrorMessage error={fetchError} />}

      {listings.length === 0 && !fetchError ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">Eşleşen ilan bulunamadı.</p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Başlık
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Danışman
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Durum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Satış
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Oluşturulma
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900 max-w-xs truncate">
                    {listing.title}
                    {listing.subtype && (
                      <span className="ml-2 text-xs text-zinc-400">{listing.subtype}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {listing.consultantName ?? listing.consultantId.slice(0, 8) + "…"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status as ListingStatus} />
                  </td>
                  <td className="px-4 py-3">
                    {listing.isSold ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Satıldı
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {listing.category === "SALE"
                      ? "Satılık"
                      : listing.category === "RENT"
                      ? "Kiralık"
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {listing.createdAt ? listing.createdAt.slice(0, 10) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/moderation/${listing.id}`}
                        className="text-zinc-600 underline hover:text-zinc-900 text-xs"
                      >
                        İncele
                      </Link>
                      {listing.status === "PUBLISHED" && (
                        <AdminUnpublishButton listingId={listing.id} />
                      )}
                      <AdminMarkSoldButton
                        listingId={listing.id}
                        isSold={listing.isSold ?? false}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              {total} ilan · Sayfa {page} / {totalPages}
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-xs">Sayfa başına:</span>
            <div className="flex gap-1">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <Link
                  key={n}
                  href={buildUrl({ limit: String(n), page: "1" })}
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
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
              >
                ← Önceki
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
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
