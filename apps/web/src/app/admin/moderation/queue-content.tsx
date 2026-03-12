"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { Listing } from "@/lib/types";

const TABS = [
  { status: "PENDING_REVIEW", label: "İnceleme Bekliyor" },
  { status: "NEEDS_CHANGES", label: "Değişiklik Bekleniyor" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 100] as const;
type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

interface Props {
  items: Listing[];
  total: number;
  currentStatus: string;
}

export function QueueContent({ items, total, currentStatus }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const filtered = search.trim()
    ? items.filter(
        (l) =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.consultantId.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handlePageSize(n: PageSize) {
    setPageSize(n);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-0 border-b border-zinc-200">
        {TABS.map((tab) => {
          const active = currentStatus === tab.status;
          return (
            <button
              key={tab.status}
              type="button"
              onClick={() => { router.push(`?status=${tab.status}`); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab.label}
              {active && (
                <span className="ml-2 rounded-full bg-zinc-900 px-1.5 py-0.5 text-xs font-medium text-white">
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Başlık veya danışman ara…"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />
      {search && (
        <p className="text-xs text-zinc-400">
          {filtered.length} sonuç / {items.length} toplam
        </p>
      )}

      {/* Results */}
      {paginated.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            {search
              ? "Arama ile eşleşen ilan bulunamadı."
              : "Bu durumda bekleyen ilan yok."}
          </p>
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
                  Danışman
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
              {paginated.map((listing) => (
                <tr key={listing.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {listing.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {listing.consultantId}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(listing.submittedAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/moderation/${listing.id}`}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                    >
                      İncele
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              {filtered.length} ilan · Sayfa {safePage} / {totalPages}
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-xs">Sayfa başına:</span>
            <div className="flex gap-1">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handlePageSize(n)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    n === pageSize
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {safePage > 1 && (
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
              >
                ← Önceki
              </button>
            )}
            {safePage < totalPages && (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
              >
                Sonraki →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
