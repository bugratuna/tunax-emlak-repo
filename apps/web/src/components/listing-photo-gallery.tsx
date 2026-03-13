"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import { getMediaUrl } from "@/lib/media";

interface Props {
  photos: MediaItem[];
  title: string;
}

export default function ListingPhotoGallery({ photos, title }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  // ── Keyboard navigation + body-scroll lock ──────────────────────────────
  //
  // Runs whenever the lightbox opens or closes.
  // - Locks body scroll so the page beneath cannot be scrolled while the
  //   lightbox is visible. The previous overflow value is restored exactly
  //   on close to avoid interfering with custom scroll containers.
  // - Escape closes the viewer. Arrow keys navigate between photos.
  // - The effect removes its listener on cleanup so no event handlers leak
  //   when the component unmounts or the lightbox opens/closes repeatedly.
  useEffect(() => {
    if (lightbox === null) return;

    const len = photos.length;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightbox(null);
      } else if (e.key === "ArrowLeft") {
        setLightbox((i) => (i === null ? null : (i - 1 + len) % len));
      } else if (e.key === "ArrowRight") {
        setLightbox((i) => (i === null ? null : (i + 1) % len));
      }
    }

    document.addEventListener("keydown", onKeyDown);

    // Lock scroll — save and restore whatever value was already set so we
    // don't clobber a parent component's intentional overflow style.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, photos.length]);

  if (photos.length === 0) return null;

  const cover = photos[0];
  const rest = photos.slice(1, 5);

  function prev() {
    setLightbox((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }
  function next() {
    setLightbox((i) => (i === null ? null : (i + 1) % photos.length));
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-xl h-64 sm:h-80">
        {/* Cover — spans 2 cols and 2 rows */}
        <button
          type="button"
          onClick={() => setLightbox(0)}
          className="col-span-2 row-span-2 relative overflow-hidden focus:outline-none"
        >
          <Image
            src={getMediaUrl(cover)}
            alt={`${title} — 1`}
            fill
            sizes="50vw"
            className="object-cover hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </button>

        {/* Thumbnails */}
        {rest.map((photo, idx) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightbox(idx + 1)}
            className="relative overflow-hidden focus:outline-none"
          >
            <Image
              src={getMediaUrl(photo)}
              alt={`${title} — ${idx + 2}`}
              fill
              sizes="25vw"
              className="object-cover hover:scale-105 transition-transform duration-300"
              unoptimized
            />
            {/* "Show all" overlay on last visible thumb when there are more */}
            {idx === 3 && photos.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-semibold">
                +{photos.length - 5} daha
              </div>
            )}
          </button>
        ))}

        {/* Fill empty slots so grid stays consistent */}
        {Array.from({ length: Math.max(0, 4 - rest.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-zinc-100" />
        ))}
      </div>

      {/* ── Lightbox ────────────────────────────────────────────────────────
          z-[1200]: well above Leaflet's panes (max z-index 1000) and controls.
          The map container itself uses `isolation: isolate` which further confines
          Leaflet z-indices, but this z-value ensures correctness even without it.
      ─────────────────────────────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — fotoğraf ${lightbox + 1} / ${photos.length}`}
          className="fixed inset-0 z-1200 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          {/* Close — higher contrast so it's visible against bright photos */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Kapat (Esc)"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Önceki fotoğraf"
              className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image — stopPropagation so clicking the photo itself does not close */}
          <div
            className="relative max-h-[85vh] max-w-[90vw] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getMediaUrl(photos[lightbox])}
              alt={`${title} — ${lightbox + 1}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Next */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Sonraki fotoğraf"
              className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white select-none">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
