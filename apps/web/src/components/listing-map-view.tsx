"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export default function ListingMapView({ lat, lng, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (mapRef.current || initializingRef.current || !containerRef.current) return;
    initializingRef.current = true;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) {
        initializingRef.current = false;
        return;
      }

      // Fix default icon paths in Next.js / webpack builds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([lat, lng], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
          `<div style="min-width:140px;font-size:13px;font-weight:600">${title}</div>`,
        )
        .openPopup();

      initializingRef.current = false;
    });

    return () => {
      initializingRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `isolate` (CSS isolation:isolate) creates a new stacking context for the
  // map container. This confines Leaflet's internal z-indices (panes: 200–1000,
  // controls: 1000) to compete only within this element — they can no longer
  // bleed above `position:fixed` overlays such as the photo lightbox.
  return (
    <div
      ref={containerRef}
      className="h-64 w-full rounded-lg border border-zinc-200 overflow-hidden isolate"
    />
  );
}
