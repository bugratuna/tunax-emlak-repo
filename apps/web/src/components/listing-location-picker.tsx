"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { updateListingLocation } from "@/lib/api/listings";

const ANTALYA_CENTER: [number, number] = [36.8969, 30.7133];
const DEFAULT_ZOOM = 13;

interface Props {
  listingId: string;
  initialLat?: number | null;
  initialLng?: number | null;
  initialCity?: string | null;
  initialDistrict?: string | null;
  initialNeighborhood?: string | null;
}

export default function ListingLocationPicker({
  listingId,
  initialLat,
  initialLng,
  initialCity,
  initialDistrict,
  initialNeighborhood,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const initializingRef = useRef(false);

  const hasCoords = initialLat != null && initialLng != null;

  const [lat, setLat] = useState<number>(
    hasCoords ? initialLat! : ANTALYA_CENTER[0],
  );
  const [lng, setLng] = useState<number>(
    hasCoords ? initialLng! : ANTALYA_CENTER[1],
  );
  const [city, setCity] = useState(initialCity ?? "");
  const [district, setDistrict] = useState(initialDistrict ?? "");
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Map init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || initializingRef.current || !containerRef.current) return;
    initializingRef.current = true;

    const center: [number, number] = hasCoords
      ? [initialLat!, initialLng!]
      : ANTALYA_CENTER;

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

      const map = L.map(containerRef.current!).setView(center, DEFAULT_ZOOM);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Draggable marker
      const marker = L.marker(center, { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setLat(parseFloat(pos.lat.toFixed(6)));
        setLng(parseFloat(pos.lng.toFixed(6)));
      });

      // Click on map moves marker
      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setLat(parseFloat(e.latlng.lat.toFixed(6)));
        setLng(parseFloat(e.latlng.lng.toFixed(6)));
      });

      initializingRef.current = false;
    });

    return () => {
      initializingRef.current = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await updateListingLocation(listingId, {
        lat,
        lng,
        city: city || undefined,
        district: district || undefined,
        neighborhood: neighborhood || undefined,
      });
      setSaved(true);
      router.refresh(); // re-fetch RSC so consultant panel and public page reflect new location
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  // ── Sync marker when lat/lng inputs change manually ───────────────────────

  function handleLatChange(v: string) {
    const n = parseFloat(v);
    setLat(isNaN(n) ? lat : n);
    if (!isNaN(n) && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([n, lng]);
      mapRef.current.panTo([n, lng]);
    }
  }

  function handleLngChange(v: string) {
    const n = parseFloat(v);
    setLng(isNaN(n) ? lng : n);
    if (!isNaN(n) && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, n]);
      mapRef.current.panTo([lat, n]);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Konum Seçimi
      </h2>

      {/* Map */}
      <div
        ref={containerRef}
        className="h-64 w-full rounded-lg border border-zinc-200 overflow-hidden"
      />

      <p className="text-xs text-zinc-400">
        Konumu değiştirmek için haritaya tıklayın veya işaretçiyi sürükleyin.
      </p>

      {/* Coordinate display / manual inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Enlem (lat)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => handleLatChange(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Boylam (lng)
          </label>
          <input
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => handleLngChange(e.target.value)}
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Address fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">İl</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Antalya"
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">İlçe</label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="Konyaaltı"
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Mahalle</label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Liman"
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>
      </div>

      {saveError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Konumu Kaydet"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">Konum kaydedildi.</span>
        )}
      </div>
    </div>
  );
}
