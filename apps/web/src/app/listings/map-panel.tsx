"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { Listing } from "@/lib/types";

// Antalya city centre — default map view
const ANTALYA_CENTER: [number, number] = [36.8969, 30.7133];
const DEFAULT_ZOOM = 11;

interface MapPanelProps {
  /** Filtered PUBLISHED listings. Map renders pins only for those with coordinates. */
  listings: Pick<Listing, "id" | "title" | "price" | "location">[];
  /** Current URL search params string so the bbox button can preserve other filters. */
  currentParams: string;
}

function formatPrice(price: Listing["price"]): string {
  if (!price) return "";
  return `${price.amount.toLocaleString("tr-TR")} ${price.currency ?? "TRY"}`;
}

/**
 * Serialises a Leaflet LatLngBounds into the bbox URL param format:
 * "{minLng},{minLat},{maxLng},{maxLat}"
 */
function boundsToParam(map: LeafletMap): string {
  const b = map.getBounds();
  return [
    b.getWest().toFixed(6),
    b.getSouth().toFixed(6),
    b.getEast().toFixed(6),
    b.getNorth().toFixed(6),
  ].join(",");
}

export default function MapPanel({ listings, currentParams }: MapPanelProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);

  // Set synchronously (before the async import) so that React StrictMode's
  // second effect invocation sees the flag and bails out before Leaflet resolves.
  // This prevents the "Map container is already initialized" crash.
  const initializingRef = useRef(false);

  // Boolean state — not a ref — so changing it schedules a re-render that lets
  // the marker effect know the map + layer group are actually ready.
  const [mapReady, setMapReady] = useState(false);

  // bbox string matching the current map viewport
  const [pendingBbox, setPendingBbox] = useState<string | null>(null);

  // isFinite guards: rejects null, undefined, and NaN — all of which would
  // crash L.marker() or produce invisible pins at [0, 0].
  const pinListings = listings.filter((l) => {
    const c = l.location?.coordinates;
    return (
      c != null &&
      isFinite(c.latitude) &&
      isFinite(c.longitude)
    );
  });
  // Stable string key used as the marker-effect dependency so it only fires
  // when the actual set of pin IDs changes, not on unrelated re-renders.
  const pinKey = pinListings.map((l) => l.id).join(",");

  // ── Effect 1: initialise the map exactly once ────────────────────────────────
  useEffect(() => {
    // Three-way guard:
    //   mapRef.current      → map already created (e.g. after StrictMode remount)
    //   initializingRef     → async import started but not yet resolved
    //   containerRef        → DOM node not yet attached
    if (mapRef.current || initializingRef.current || !containerRef.current) return;

    // Set the flag SYNCHRONOUSLY before awaiting the dynamic import.
    // StrictMode cleanup resets it so the remounted effect can proceed safely.
    initializingRef.current = true;

    import("leaflet")
      .then((L) => {
        // Bail if cleanup ran while we were waiting (StrictMode unmount/remount
        // or genuine navigation away). mapRef check also blocks the "second
        // promise wins" scenario in case two imports resolved concurrently.
        if (!containerRef.current || mapRef.current) {
          initializingRef.current = false;
          return;
        }

        // Fix default icon paths broken in webpack / Next.js builds.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const map = L.map(containerRef.current).setView(
          ANTALYA_CENTER,
          DEFAULT_ZOOM,
        );
        mapRef.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        markerLayerRef.current = L.layerGroup().addTo(map);
        initializingRef.current = false;

        // Track viewport so we can offer "Bu alanda ara"
        function onViewportChange() {
          setPendingBbox(boundsToParam(map));
        }
        map.on("moveend", onViewportChange);
        map.on("zoomend", onViewportChange);
        onViewportChange();

        // Signal the marker effect — this triggers a re-render so the marker
        // effect fires with the already-loaded listings.
        setMapReady(true);
      })
      .catch((err) => {
        console.error("[MapPanel] Leaflet failed to load:", err);
        initializingRef.current = false;
      });

    return () => {
      // Cleanup runs synchronously on StrictMode unmount (before the promise
      // resolves).  Reset both guards so the remount can start cleanly.
      initializingRef.current = false;
      setMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // ── Effect 2: rebuild markers whenever listings change or map becomes ready ──
  // Depends on mapReady so it never fires before the map + layer group exist.
  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    const map = mapRef.current;
    if (!mapReady || !markerLayer || !map) return;

    import("leaflet")
      .then((L) => {
        markerLayer.clearLayers();

        pinListings.forEach((listing) => {
          const { latitude, longitude } = listing.location!.coordinates!;
          const marker = L.marker([latitude, longitude]);
          const price = formatPrice(listing.price);
          marker.bindPopup(
            `<div style="min-width:160px">
              <p style="font-weight:600;font-size:13px;margin:0 0 4px">${listing.title}</p>
              ${price ? `<p style="font-size:12px;margin:0 0 6px;color:#555">${price}</p>` : ""}
              <a href="/listings/${listing.id}" style="font-size:12px;color:#3b82f6;text-decoration:underline">
                İlanı gör →
              </a>
            </div>`,
          );
          markerLayer.addLayer(marker);
        });

        // Auto-fit: zoom to markers when results exist; reset to default otherwise.
        if (pinListings.length > 0) {
          const bounds = L.latLngBounds(
            pinListings.map(
              (l) =>
                [
                  l.location!.coordinates!.latitude,
                  l.location!.coordinates!.longitude,
                ] as [number, number],
            ),
          );
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } else {
          map.setView(ANTALYA_CENTER, DEFAULT_ZOOM);
        }
      })
      .catch((err) => {
        console.error("[MapPanel] Marker update failed:", err);
      });
    // pinListings is intentionally omitted: pinKey is a stable string proxy
    // for the same data. Adding pinListings would re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, pinKey]);

  function handleSearchInArea() {
    if (!pendingBbox) return;
    const params = new URLSearchParams(currentParams);
    params.set("bbox", pendingBbox);
    router.push("?" + params.toString());
  }

  function handleDismissBbox() {
    const params = new URLSearchParams(currentParams);
    params.delete("bbox");
    router.push("?" + params.toString());
  }

  // Show the button only when the pending viewport differs from the bbox already in the URL
  const currentBbox = new URLSearchParams(currentParams).get("bbox") ?? null;
  const showSearchButton = pendingBbox !== null && pendingBbox !== currentBbox;
  const bboxActive = currentBbox !== null;

  return (
    <div className="relative rounded-lg overflow-hidden border border-zinc-200">
      <div ref={containerRef} className="h-64 w-full" />

      {bboxActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
          <span>Harita alanı filtreleniyor</span>
          <button
            type="button"
            onClick={handleDismissBbox}
            aria-label="Harita filtresini kaldır"
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-blue-100"
          >
            ×
          </button>
        </div>
      )}

      {showSearchButton && (
        <button
          type="button"
          onClick={handleSearchInArea}
          className="absolute bottom-3 right-3 z-[1000] rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          Bu alanda ara
        </button>
      )}

      {pinListings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rounded bg-white/90 px-3 py-1.5 text-xs text-zinc-400 shadow-sm">
            Koordinat verisi olan ilan yok
          </span>
        </div>
      )}
    </div>
  );
}
