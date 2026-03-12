"use client";

/**
 * Browser-only widgets for the consultant listing detail page.
 *
 * Same reason as listings/[id]/client-widgets.tsx:
 * `dynamic({ ssr: false })` is forbidden in Server Components (App Router).
 * This file is the "use client" boundary that makes it legal.
 */

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

// ── Dynamically imported — browser only ─────────────────────────────────────

const ListingPhotoManager = dynamic(
  () => import("@/components/listing-photo-manager"),
  { ssr: false },
);

const ListingLocationPicker = dynamic(
  () => import("@/components/listing-location-picker"),
  { ssr: false },
);

// ── Combined widget ───────────────────────────────────────────────────────────

interface Props {
  listing: Listing;
}

/**
 * Renders the photo manager and location picker for the consultant panel.
 * Both components require browser APIs (drag-and-drop, Leaflet) so they
 * are lazy-loaded with ssr:false inside this Client Component boundary.
 */
export default function ConsultantListingWidgets({ listing }: Props) {
  const coords = listing.location?.coordinates;
  const photos = listing.media ?? [];

  return (
    <>
      <ListingPhotoManager listingId={listing.id} initialPhotos={photos} />

      <ListingLocationPicker
        listingId={listing.id}
        initialLat={coords?.latitude ?? null}
        initialLng={coords?.longitude ?? null}
        initialCity={listing.location?.city ?? null}
        initialDistrict={listing.location?.district ?? null}
        initialNeighborhood={listing.location?.neighborhood ?? null}
        initialStreet={listing.location?.street ?? null}
        initialAddressDetails={listing.location?.addressDetails ?? null}
      />
    </>
  );
}
