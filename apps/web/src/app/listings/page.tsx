import Link from "next/link";
import { Suspense } from "react";
import { listListings } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import { FilterSidebar } from "./filter-sidebar";
import type { Listing } from "@/lib/types";

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Daire",
  VILLA: "Villa",
  HOUSE: "Müstakil Ev",
  LAND: "Arsa",
  COMMERCIAL: "İşyeri",
  OTHER: "Diğer",
};

interface SearchParams {
  category?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  rooms?: string;
  balcony?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function ListingsPage({ searchParams }: Props) {
  const params = await searchParams;

  let listings: Listing[] = [];
  let fetchError: string | null = null;

  try {
    listings = await listListings();
    console.log(listings);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Sunucuya ulaşılamıyor.";
  }

  // Client-side filtering (applied after fetch)
  if (!fetchError) {
    if (params.category) {
      listings = listings.filter((l) => l.category === params.category);
    }
    if (params.district) {
      listings = listings.filter(
        (l) => l.location?.district === params.district,
      );
    }
    if (params.minPrice) {
      const min = Number(params.minPrice);
      listings = listings.filter((l) => (l.price?.amount ?? 0) >= min);
    }
    if (params.maxPrice) {
      const max = Number(params.maxPrice);
      listings = listings.filter(
        (l) => (l.price?.amount ?? Infinity) <= max,
      );
    }
    if (params.rooms) {
      const minRooms = Number(params.rooms);
      listings = listings.filter(
        (l) => (l.specifications?.roomCount ?? 0) >= minRooms,
      );
    }
    if (params.balcony === "true") {
      listings = listings.filter((l) => l.specifications?.hasBalcony);
    }
  }

  return (
    <div className="flex gap-6">
      {/* Filter sidebar — wrapped in Suspense because it uses useSearchParams */}
      <Suspense>
        <FilterSidebar />
      </Suspense>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Map placeholder */}
        <div className="relative flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50">
          <span className="text-sm text-zinc-400">
            Harita — yakında (PostGIS bounding box araması planlanıyor)
          </span>
          <button
            type="button"
            disabled
            className="absolute bottom-3 right-3 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 cursor-not-allowed"
            title="Bu özellik henüz aktif değil"
          >
            Bu alanda ara
          </button>
        </div>

        {/* Listing grid */}
        {fetchError ? (
          <ApiErrorMessage error={fetchError} />
        ) : listings.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">
              {Object.keys(params).length > 0
                ? "Seçili filtrelere uygun ilan bulunamadı."
                : "Henüz yayınlanmış ilan bulunmuyor."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatPrice(listing: Listing): string {
  if (!listing.price) return "";
  const amount = listing.price.amount.toLocaleString("tr-TR");
  const currency = listing.price.currency ?? "TRY";
  const suffix = listing.price.isNegotiable ? " · Pazarlığa açık" : "";
  return `${amount} ${currency}${suffix}`;
}

function ListingCard({ listing }: { listing: Listing }) {
  const price = formatPrice(listing);
  const typeLabel = listing.propertyType
    ? PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType
    : null;
  const district = listing.location?.district;
  const rooms = listing.specifications?.roomCount;
  const area = listing.specifications?.grossArea;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-shadow"
    >
      {/* Image placeholder */}
      <div className="mb-3 flex h-36 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
        Fotoğraf yok
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-900 line-clamp-2">
          {listing.title}
        </h3>
        <StatusBadge status={listing.status} />
      </div>

      {/* Facts row */}
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
        {new Date(listing.submittedAt).toLocaleDateString("tr-TR")}
      </p>
    </Link>
  );
}
