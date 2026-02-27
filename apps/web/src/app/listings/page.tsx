import Link from "next/link";
import { listListings } from "@/lib/api/listings";
import { StatusBadge } from "@/components/status-badge";
import { ApiErrorMessage } from "@/components/api-error-message";
import type { Listing } from "@/lib/types";

const DISTRICTS = [
  "Muratpaşa", "Kepez", "Konyaaltı", "Döşemealtı", "Aksu",
  "Alanya", "Manavgat", "Serik", "Kemer", "Kumluca",
  "Finike", "Kaş", "Demre", "Elmalı", "Korkuteli",
  "Akseki", "Gündoğmuş", "İbradı", "Gazipaşa",
];

export default async function ListingsPage() {
  let listings: Listing[] = [];
  let fetchError: string | null = null;

  try {
    listings = await listListings();
  } catch (e) {
    fetchError =
      e instanceof Error ? e.message : "Unable to reach server.";
  }

  return (
    <div className="flex gap-6">
      {/* Filter sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Filters
          </h2>

          <div className="space-y-4 text-sm">
            <fieldset>
              <legend className="mb-1 font-medium text-zinc-700">Category</legend>
              {["RENT", "SALE"].map((c) => (
                <label key={c} className="flex items-center gap-2 text-zinc-600">
                  <input type="checkbox" className="rounded border-zinc-300" />
                  {c}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend className="mb-1 font-medium text-zinc-700">Type</legend>
              {["APARTMENT", "VILLA", "HOUSE", "LAND", "COMMERCIAL", "OTHER"].map((t) => (
                <label key={t} className="flex items-center gap-2 text-zinc-600">
                  <input type="checkbox" className="rounded border-zinc-300" />
                  {t}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend className="mb-1 font-medium text-zinc-700">District</legend>
              <select className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400">
                <option value="">All districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </fieldset>

            <fieldset>
              <legend className="mb-1 font-medium text-zinc-700">Price (TRY)</legend>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
                <span className="text-zinc-400">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full rounded border border-zinc-300 px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>
            </fieldset>
          </div>

          <p className="mt-4 text-xs text-zinc-400">
            Filters will query the API once the list endpoint is available.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Map placeholder */}
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
          Map coming soon — PostGIS bounding box search not yet implemented
        </div>

        {/* Listing grid */}
        {fetchError ? (
          <ApiErrorMessage error={fetchError} />
        ) : listings.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
            <p className="text-sm text-zinc-500">No listings available yet.</p>
            <p className="mt-1 text-xs text-zinc-400">
              (GET /api/listings endpoint is not yet implemented — stub returns empty array)
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

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:shadow-sm transition-shadow"
    >
      {/* Image placeholder */}
      <div className="mb-3 flex h-36 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">
        No image
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-900 line-clamp-2">{listing.title}</h3>
        <StatusBadge status={listing.status} />
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Submitted {new Date(listing.submittedAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
