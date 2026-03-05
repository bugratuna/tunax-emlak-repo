"use client";

import { useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/types";

interface Props {
  photos: MediaItem[];
  title: string;
}

export default function ListingPhotoGallery({ photos, title }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

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
            src={cover.url}
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
              src={photo.url}
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

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Kapat"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Önceki"
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-h-[85vh] max-w-[90vw] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightbox].url}
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
              aria-label="Sonraki"
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {lightbox + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
