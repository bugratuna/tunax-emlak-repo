import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { listListings } from "@/lib/api/listings";
import type { ListingsQueryParams } from "@/lib/api/listings";
import { ApiRequestError } from "@/lib/api/client";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { FilterSidebar } from "./filter-sidebar";
import { MapPanel } from "./map-panel-wrapper";
import { ViewToggle } from "./view-toggle";
import type { ViewMode } from "./view-toggle";
import { SortSelect } from "./sort-select";
import type { Listing } from "@/lib/types";
import { getBlockedFilters, FILTER_FEATURE_GROUP_NAMES } from "@/lib/taxonomy";
import { getMediaUrl } from "@/lib/media";

// ── searchParams types ────────────────────────────────────────────────────────
type RawParam = string | string[] | undefined;

interface SearchParams {
  // taxonomy
  category?: RawParam;
  propertyType?: RawParam;
  subtype?: RawParam;
  // price
  minPrice?: RawParam;
  maxPrice?: RawParam;
  // area
  minM2Gross?: RawParam;
  maxM2Gross?: RawParam;
  minM2Net?: RawParam;
  maxM2Net?: RawParam;
  // specs
  roomCount?: RawParam;
  /** Multi-select room counts — comma-separated display strings e.g. "1+1,2+1". */
  roomCounts?: RawParam;
  bathroomCount?: RawParam;
  floorNumber?: RawParam;
  totalFloors?: RawParam;
  minBuildingAge?: RawParam;
  maxBuildingAge?: RawParam;
  // selects
  heatingType?: RawParam;
  kitchenState?: RawParam;
  // booleans
  carPark?: RawParam;
  isFurnished?: RawParam;
  hasBalcony?: RawParam;
  hasElevator?: RawParam;
  inComplex?: RawParam;
  isLoanEligible?: RawParam;
  isSwapAvailable?: RawParam;
  // dues
  minDues?: RawParam;
  maxDues?: RawParam;
  // location
  district?: RawParam;
  neighborhood?: RawParam;
  bbox?: RawParam;
  // feature groups (repeated params → string[])
  facades?: RawParam;
  interiorFeatures?: RawParam;
  exteriorFeatures?: RawParam;
  vicinity?: RawParam;
  transportation?: RawParam;
  view?: RawParam;
  housingType?: RawParam;
  accessibility?: RawParam;
  // sort
  sortBy?: RawParam;
  // pagination
  page?: RawParam;
  limit?: RawParam;
  // view mode toggle (grid | list) — separate from the `view` feature-group filter
  viewMode?: RawParam;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

function str(v: RawParam): string | undefined {
  if (!v) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  return s || undefined;
}

function arr(v: RawParam): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).filter(Boolean);
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams;

  // ── Resolve subtype-blocked params ────────────────────────────────────────
  const subtype = str(params.subtype);
  const blocked = getBlockedFilters(subtype);

  const strippedKeys: string[] = [];
  function maybeStrip(key: string, present: boolean) {
    if (present && blocked.has(key)) {
      strippedKeys.push(key);
      return true;
    }
    return false;
  }

  // ── Build backend params ──────────────────────────────────────────────────
  const backendParams: ListingsQueryParams = {
    // Public page always scoped to PUBLISHED listings only
    status: "PUBLISHED",
    category: str(params.category),
    propertyType: str(params.propertyType),
    subtype,
    minPrice: str(params.minPrice),
    maxPrice: str(params.maxPrice),
    minM2Gross: str(params.minM2Gross),
    maxM2Gross: str(params.maxM2Gross),
    minM2Net: str(params.minM2Net),
    maxM2Net: str(params.maxM2Net),
    // roomCount from legacy single-select param (not the multi-select roomCounts)
    roomCount: maybeStrip("roomCount", !!str(params.roomCount))
      ? undefined
      : str(params.roomCount),
    // roomCounts: multi-select, sent to backend as comma-separated string
    roomCounts: str(params.roomCounts),
    bathroomCount: maybeStrip("bathroomCount", !!str(params.bathroomCount))
      ? undefined
      : str(params.bathroomCount),
    floorNumber: maybeStrip("floorNumber", !!str(params.floorNumber))
      ? undefined
      : str(params.floorNumber),
    totalFloors: maybeStrip("totalFloors", !!str(params.totalFloors))
      ? undefined
      : str(params.totalFloors),
    minBuildingAge: maybeStrip("minBuildingAge", !!str(params.minBuildingAge))
      ? undefined
      : str(params.minBuildingAge),
    maxBuildingAge: maybeStrip("maxBuildingAge", !!str(params.maxBuildingAge))
      ? undefined
      : str(params.maxBuildingAge),
    heatingType: maybeStrip("heatingType", !!str(params.heatingType))
      ? undefined
      : str(params.heatingType),
    kitchenState: maybeStrip("kitchenState", !!str(params.kitchenState))
      ? undefined
      : str(params.kitchenState),
    carPark: str(params.carPark),
    isFurnished: maybeStrip("isFurnished", !!str(params.isFurnished))
      ? undefined
      : str(params.isFurnished),
    hasBalcony: maybeStrip("hasBalcony", !!str(params.hasBalcony))
      ? undefined
      : str(params.hasBalcony),
    hasElevator: maybeStrip("hasElevator", !!str(params.hasElevator))
      ? undefined
      : str(params.hasElevator),
    inComplex: maybeStrip("inComplex", !!str(params.inComplex))
      ? undefined
      : str(params.inComplex),
    isLoanEligible: str(params.isLoanEligible),
    isSwapAvailable: str(params.isSwapAvailable),
    minDues: maybeStrip("minDues", !!str(params.minDues))
      ? undefined
      : str(params.minDues),
    maxDues: maybeStrip("maxDues", !!str(params.maxDues))
      ? undefined
      : str(params.maxDues),
    district: str(params.district),
    neighborhood: str(params.neighborhood),
    bbox: str(params.bbox),
    facades: arr(params.facades),
    interiorFeatures: maybeStrip(
      "interiorFeatures",
      arr(params.interiorFeatures).length > 0,
    )
      ? undefined
      : arr(params.interiorFeatures),
    exteriorFeatures: arr(params.exteriorFeatures),
    vicinity: arr(params.vicinity),
    transportation: arr(params.transportation),
    view: arr(params.view),
    housingType: maybeStrip(
      "housingType",
      arr(params.housingType).length > 0,
    )
      ? undefined
      : arr(params.housingType),
    accessibility: arr(params.accessibility),
    sortBy: str(params.sortBy) ?? "newest",
    page: str(params.page) ? Number(str(params.page)) : 1,
    limit: [12, 24, 100].includes(Number(str(params.limit))) ? Number(str(params.limit)) : 12,
  };

  // roomCounts multi-select is now handled by the backend (IN query).
  // Keep selectedRoomCounts for hasActiveFilters calculation.
  const selectedRoomCounts = (str(params.roomCounts) ?? "")
    .split(",")
    .filter(Boolean);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  let listings: Listing[] = [];
  let total = 0;
  let fetchError: string | null = null;
  let filterNotAllowedError: string | null = null;

  try {
    const result = await listListings(backendParams);
    listings = result.data.filter((l) => l.status === "PUBLISHED");
    total = result.total;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 400) {
      const body = e.body as unknown as Record<string, unknown>;
      if (body?.error === "FILTER_NOT_ALLOWED_FOR_SUBTYPE") {
        const disallowed = body.disallowed as string[] | undefined;
        filterNotAllowedError =
          `"${body.subtype}" alt tipi için geçerli olmayan filtreler gönderildi` +
          (disallowed?.length ? `: ${disallowed.join(", ")}` : "") +
          ". Filtreler güncellendi.";
        const sanitised = { ...backendParams };
        for (const key of disallowed ?? []) {
          (sanitised as Record<string, unknown>)[key] = undefined;
        }
        for (const g of FILTER_FEATURE_GROUP_NAMES) {
          if (disallowed?.includes(g)) {
            (sanitised as Record<string, unknown>)[g] = undefined;
          }
        }
        try {
          const result = await listListings(sanitised);
          listings = result.data.filter((l) => l.status === "PUBLISHED");
          total = result.total;
        } catch {
          fetchError = "İlanlar yüklenemedi. Lütfen sayfayı yenileyin.";
        }
      } else {
        fetchError =
          typeof e.body?.message === "string"
            ? e.body.message
            : "Arama parametrelerinde hata oluştu.";
      }
    } else {
      fetchError =
        e instanceof Error ? e.message : "Sunucuya ulaşılamıyor.";
    }
  }

  // ── Serialise current params for MapPanel ────────────────────────────────
  const currentParamEntries: string[] = [];
  const allParamKeys = [
    "category",
    "propertyType",
    "subtype",
    "minPrice",
    "maxPrice",
    "minM2Gross",
    "maxM2Gross",
    "minM2Net",
    "maxM2Net",
    "roomCount",
    "roomCounts",
    "bathroomCount",
    "floorNumber",
    "totalFloors",
    "minBuildingAge",
    "maxBuildingAge",
    "heatingType",
    "kitchenState",
    "carPark",
    "isFurnished",
    "hasBalcony",
    "hasElevator",
    "inComplex",
    "isLoanEligible",
    "isSwapAvailable",
    "minDues",
    "maxDues",
    "district",
    "neighborhood",
    "bbox",
    "sortBy",
    ...FILTER_FEATURE_GROUP_NAMES,
  ] as const;

  for (const key of allParamKeys) {
    const raw = (params as Record<string, RawParam>)[key];
    if (!raw) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      if (v) {
        currentParamEntries.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(v)}`,
        );
      }
    }
  }
  const currentParamString = currentParamEntries.join("&");
  const hasActiveFilters =
    currentParamEntries.length > 0 || selectedRoomCounts.length > 0;

  const currentPage = Math.max(1, Number(str(params.page) ?? 1) || 1);
  const pageSize = backendParams.limit as number;
  const totalPages = Math.ceil(total / pageSize);
  const viewMode: ViewMode = str(params.viewMode) === "list" ? "list" : "grid";

  return (
    <div className="flex gap-6">
      <Suspense>
        <FilterSidebar />
      </Suspense>

      <div className="flex-1 space-y-4">
        {strippedKeys.length > 0 && !filterNotAllowedError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Bazı filtreler seçili alt tip için geçerli değil ve kaldırıldı:{" "}
            <span className="font-medium">{strippedKeys.join(", ")}</span>
          </div>
        )}
        {filterNotAllowedError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {filterNotAllowedError}
          </div>
        )}

        <MapPanel listings={listings} currentParams={currentParamString} />

        <div className="flex items-center justify-between">
          <ActiveFilterChips params={params} />
          <div className="flex items-center gap-2">
            <Suspense>
              <SortSelect current={str(params.sortBy) ?? "newest"} />
            </Suspense>
            <Suspense>
              <ViewToggle current={viewMode} />
            </Suspense>
          </div>
        </div>

        {fetchError ? (
          <ApiErrorMessage error={fetchError} />
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-zinc-200/80 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-2xl">
              🏠
            </div>
            <p className="text-sm font-medium text-zinc-700">
              {hasActiveFilters
                ? "Seçili filtrelere uygun ilan bulunamadı."
                : "Henüz yayınlanmış ilan bulunmuyor."}
            </p>
            {hasActiveFilters && (
              <Link href="/listings" className="mt-3 inline-block text-xs text-amber-700 hover:underline">
                Filtreleri temizle
              </Link>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-3">
            {listings.map((listing) => (
              <ListingCardRow key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <span>{total} ilan · Sayfa {currentPage} / {Math.max(1, totalPages)}</span>
              {/* Page-size selector */}
              <span className="text-zinc-300">|</span>
              <span className="text-xs">Sayfa başına:</span>
              <div className="flex gap-1">
                {[12, 24, 100].map((n) => (
                  <PageSizeLink key={n} params={params} size={n} current={pageSize}>
                    {n}
                  </PageSizeLink>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <PaginationLink params={params} page={currentPage - 1}>
                  ← Önceki
                </PaginationLink>
              )}
              {currentPage < totalPages && (
                <PaginationLink params={params} page={currentPage + 1}>
                  Sonraki →
                </PaginationLink>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PaginationLink ────────────────────────────────────────────────────────────

function PaginationLink({
  params,
  page,
  children,
}: {
  params: SearchParams;
  page: number;
  children: React.ReactNode;
}) {
  const qs = new URLSearchParams();
  for (const [k, raw] of Object.entries(params)) {
    // carry all params except `page` (we set it explicitly below)
    if (!raw || k === "page") continue;
    const vals = Array.isArray(raw) ? raw : [raw];
    for (const v of vals) if (v) qs.append(k, v);
  }
  if (page > 1) qs.set("page", String(page));
  const q = qs.toString();
  return (
    <Link
      href={`/listings${q ? `?${q}` : ""}`}
      className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-50"
    >
      {children}
    </Link>
  );
}

// ── PageSizeLink ──────────────────────────────────────────────────────────────

function PageSizeLink({
  params,
  size,
  current,
  children,
}: {
  params: SearchParams;
  size: number;
  current: number;
  children: React.ReactNode;
}) {
  const qs = new URLSearchParams();
  for (const [k, raw] of Object.entries(params)) {
    if (!raw || k === "page" || k === "limit") continue;
    const vals = Array.isArray(raw) ? raw : [raw];
    for (const v of vals) if (v) qs.append(k, v);
  }
  qs.set("limit", String(size));
  // Reset to page 1 when changing page size
  const q = qs.toString();
  const isActive = size === current;
  return (
    <Link
      href={`/listings${q ? `?${q}` : ""}`}
      className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
        isActive
          ? "bg-zinc-900 text-white"
          : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}

// ── ActiveFilterChips ─────────────────────────────────────────────────────────

const CHIP_BOOL_LABELS: Record<string, string> = {
  isFurnished: "Eşyalı",
  hasBalcony: "Balkon",
  hasElevator: "Asansör",
  inComplex: "Site İçi",
  isLoanEligible: "Krediye Uygun",
  isSwapAvailable: "Takas",
  carPark: "Otopark",
};
const CHIP_CATEGORY_LABELS: Record<string, string> = { SALE: "Satılık", RENT: "Kiralık" };

function buildChipUrl(params: SearchParams, removeKey: string, removeValue?: string): string {
  const out = new URLSearchParams();
  for (const [k, raw] of Object.entries(params)) {
    if (!raw) continue;
    const vals = Array.isArray(raw) ? raw : [raw];
    for (const val of vals) {
      if (!val) continue;
      if (k !== removeKey) { out.append(k, val); continue; }
      if (removeValue === undefined) continue; // remove whole key
      if (k === "roomCounts") {
        // comma-separated — remove just this one value
        const remaining = val.split(",").filter((x: string) => x !== removeValue);
        if (remaining.length > 0) out.set(k, remaining.join(","));
      } else if (val !== removeValue) {
        out.append(k, val); // repeated param — keep other values
      }
    }
  }
  return "/listings?" + out.toString();
}

function ActiveFilterChips({ params }: { params: SearchParams }) {
  type Chip = { label: string; href: string };
  const chips: Chip[] = [];

  const s = (v: RawParam) => (Array.isArray(v) ? v[0] : v) || undefined;

  if (s(params.category))
    chips.push({ label: CHIP_CATEGORY_LABELS[s(params.category)!] ?? s(params.category)!, href: buildChipUrl(params, "category") });
  if (s(params.propertyType))
    chips.push({ label: s(params.propertyType)!, href: buildChipUrl(params, "propertyType") });
  if (s(params.subtype))
    chips.push({ label: s(params.subtype)!, href: buildChipUrl(params, "subtype") });
  if (s(params.district))
    chips.push({ label: s(params.district)!, href: buildChipUrl(params, "district") });
  if (s(params.neighborhood))
    chips.push({ label: s(params.neighborhood)!, href: buildChipUrl(params, "neighborhood") });
  if (s(params.minPrice))
    chips.push({ label: `Min ₺${Number(s(params.minPrice)).toLocaleString("tr-TR")}`, href: buildChipUrl(params, "minPrice") });
  if (s(params.maxPrice))
    chips.push({ label: `Max ₺${Number(s(params.maxPrice)).toLocaleString("tr-TR")}`, href: buildChipUrl(params, "maxPrice") });
  if (s(params.minM2Gross))
    chips.push({ label: `Min ${s(params.minM2Gross)} m²`, href: buildChipUrl(params, "minM2Gross") });
  if (s(params.maxM2Gross))
    chips.push({ label: `Max ${s(params.maxM2Gross)} m²`, href: buildChipUrl(params, "maxM2Gross") });
  if (s(params.heatingType))
    chips.push({ label: s(params.heatingType)!, href: buildChipUrl(params, "heatingType") });
  if (s(params.kitchenState))
    chips.push({ label: s(params.kitchenState)!, href: buildChipUrl(params, "kitchenState") });
  if (s(params.bbox))
    chips.push({ label: "Harita alanı", href: buildChipUrl(params, "bbox") });

  for (const [key, label] of Object.entries(CHIP_BOOL_LABELS)) {
    if (s((params as Record<string, RawParam>)[key]) === "true")
      chips.push({ label, href: buildChipUrl(params, key) });
  }
  // roomCounts (comma-separated — one chip per value)
  for (const rc of (s(params.roomCounts) ?? "").split(",").filter(Boolean))
    chips.push({ label: rc, href: buildChipUrl(params, "roomCounts", rc) });
  // feature groups (repeated params — one chip per value)
  for (const group of FILTER_FEATURE_GROUP_NAMES) {
    const values = arr((params as Record<string, RawParam>)[group]);
    for (const v of values)
      chips.push({ label: v, href: buildChipUrl(params, group, v) });
  }

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label + chip.href}
          href={chip.href}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-2.5 py-0.5 text-xs text-zinc-700 hover:border-zinc-500 hover:bg-zinc-50"
        >
          {chip.label}
          <span className="text-zinc-400">×</span>
        </Link>
      ))}
      <Link
        href="/listings"
        className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
      >
        Tümünü temizle
      </Link>
    </div>
  );
}

// ── ListingCard ───────────────────────────────────────────────────────────────

function formatPrice(listing: Listing): string {
  if (!listing.price) return "";
  const amount = listing.price.amount.toLocaleString("tr-TR");
  const currency = listing.price.currency ?? "TRY";
  const suffix = listing.price.isNegotiable ? " · Pazarlığa açık" : "";
  return `${amount} ${currency}${suffix}`;
}

function coverUrl(listing: Listing): string | null {
  if (!listing.media?.length) return null;
  // Prefer the isCover-flagged photo, fall back to first.
  const cover = listing.media.find((m) => m.isCover) ?? listing.media[0];
  if (!cover) return null;
  // Route all image delivery through the same-origin proxy so private-bucket
  // images load correctly in both SSR-rendered HTML and CSR components.
  return getMediaUrl(cover);
}

// ── Grid card (default) ───────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const price = formatPrice(listing);
  const typeLabel = listing.subtype ?? listing.propertyType ?? null;
  const district = listing.location?.district;
  const rooms = listing.specifications?.roomCount;
  const area = listing.specifications?.grossArea;
  const photo = coverUrl(listing);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="rt-listing-card block rounded-xl border border-zinc-200/80 bg-white p-4 hover:border-zinc-300"
    >
      {photo ? (
        <div className="relative mb-3 h-36 overflow-hidden rounded bg-zinc-100">
          <Image
            src={photo}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="mb-3 flex h-36 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
          Fotoğraf yok
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-900 line-clamp-2">
          {listing.title}
        </h3>
        <StatusBadge status={listing.status} />
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
        {typeLabel && <span>{typeLabel}</span>}
        {district && <span>{district}</span>}
        {rooms != null && <span>{rooms} oda</span>}
        {area != null && <span>{area} m²</span>}
      </div>

      {price && (
        <p className="mt-2 text-sm font-semibold text-zinc-800">{price}</p>
      )}

      <p className="mt-1 text-xs text-zinc-400">
        {listing.submittedAt.slice(0, 10)}
      </p>
    </Link>
  );
}

// ── List / row card ───────────────────────────────────────────────────────────

function ListingCardRow({ listing }: { listing: Listing }) {
  const price = formatPrice(listing);
  const typeLabel = listing.subtype ?? listing.propertyType ?? null;
  const district = listing.location?.district;
  const rooms = listing.specifications?.roomCount;
  const area = listing.specifications?.grossArea;
  const photo = coverUrl(listing);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="rt-listing-card flex gap-4 rounded-xl border border-zinc-200/80 bg-white p-3 hover:border-zinc-300"
    >
      {/* Thumbnail */}
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded bg-zinc-100">
        {photo ? (
          <Image
            src={photo}
            alt={listing.title}
            fill
            sizes="128px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            Yok
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-zinc-900 line-clamp-2 leading-snug">
              {listing.title}
            </h3>
            <StatusBadge status={listing.status} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
            {typeLabel && <span>{typeLabel}</span>}
            {district && <span>📍 {district}, Antalya</span>}
            {rooms != null && <span>{rooms} oda</span>}
            {area != null && <span>{area} m²</span>}
          </div>
        </div>
        <div className="flex items-center justify-between">
          {price ? (
            <p className="text-sm font-semibold text-zinc-900">{price}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-zinc-400">
            {listing.submittedAt.slice(0, 10)}
          </p>
        </div>
      </div>
    </Link>
  );
}
