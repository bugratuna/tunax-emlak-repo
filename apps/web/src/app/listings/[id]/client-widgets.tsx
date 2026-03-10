"use client";

/**
 * All browser-only (ssr:false) widgets for the public listing detail page.
 *
 * Why this file exists:
 * In Next.js App Router, `next/dynamic` with `{ ssr: false }` is only valid
 * inside a Client Component ("use client"). Calling it at module scope in a
 * Server Component throws at build time. Moving the dynamic() calls here
 * keeps page.tsx a pure Server Component while still lazy-loading Leaflet
 * and the lightbox only in the browser.
 */

import dynamic from "next/dynamic";
import type { MediaItem } from "@/lib/types";

// ── Dynamically imported — browser only ─────────────────────────────────────

const ListingPhotoGallery = dynamic(
  () => import("@/components/listing-photo-gallery"),
  { ssr: false },
);

const ListingMapView = dynamic(
  () => import("@/components/listing-map-view"),
  { ssr: false },
);

// ── Named exports used at specific layout positions in page.tsx ──────────────

interface GalleryWidgetProps {
  photos: MediaItem[];
  title: string;
}

export function PhotoGalleryWidget({ photos, title }: GalleryWidgetProps) {
  // DEV-ONLY: remove after confirming photos load correctly
  if (process.env.NODE_ENV !== "production") {
    console.log("[PhotoGallery] photos:", photos);
  }

  if (photos.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
        Fotoğraf eklenmemiş
      </div>
    );
  }
  return <ListingPhotoGallery photos={photos} title={title} />;
}

interface MapWidgetProps {
  lat: number | null | undefined;
  lng: number | null | undefined;
  title: string;
}

export function MapWidget({ lat, lng, title }: MapWidgetProps) {
  if (lat == null || lng == null) return null;
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Konum
      </h2>
      <ListingMapView lat={lat} lng={lng} title={title} />
    </div>
  );
}
