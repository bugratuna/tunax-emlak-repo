"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { updateListingLocation } from "@/lib/api/listings";
import { reverseGeocode } from "@/lib/geo/reverse-geocode";

const ANTALYA_CENTER: [number, number] = [36.8969, 30.7133];
const DEFAULT_ZOOM = 13;

interface Props {
  listingId: string;
  initialLat?: number | null;
  initialLng?: number | null;
  initialCity?: string | null;
  initialDistrict?: string | null;
  initialNeighborhood?: string | null;
  initialStreet?: string | null;
  initialAddressDetails?: string | null;
}

export default function ListingLocationPicker({
  listingId,
  initialLat,
  initialLng,
  initialCity,
  initialDistrict,
  initialNeighborhood,
  initialStreet,
  initialAddressDetails,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const initializingRef = useRef(false);

  // ── Geocoding refs ───────────────────────────────────────────────────────
  // AbortController for cancelling in-flight Nominatim requests.
  const geocodeAbortRef = useRef<AbortController | null>(null);
  // Debounce timer for manual coordinate input.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks fields the user has manually edited — geocoder will not overwrite these.
  // Cleared on map click / marker drag (user is explicitly choosing a new location).
  const dirtyFieldsRef = useRef(new Set<string>());
  // Holds the latest triggerGeocode function so Leaflet event handlers
  // (registered once at mount) always call the current version.
  const triggerGeocodeRef = useRef<
    ((lat: number, lng: number) => Promise<void>) | null
  >(null);

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
  const [street, setStreet] = useState(initialStreet ?? "");
  const [addressDetails, setAddressDetails] = useState(
    initialAddressDetails ?? "",
  );
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Keep triggerGeocodeRef current every render ───────────────────────────
  //
  // React state setters (setCity, setDistrict, etc.) are guaranteed stable
  // references across renders, so we can safely close over them here without
  // stale-closure risk. The ref update runs before the next paint, ensuring
  // Leaflet handlers always call the latest function.
  //
  useEffect(() => {
    triggerGeocodeRef.current = async (newLat: number, newLng: number) => {
      // Cancel any in-flight request before starting a new one.
      geocodeAbortRef.current?.abort();
      const controller = new AbortController();
      geocodeAbortRef.current = controller;

      setGeocoding(true);
      try {
        const result = await reverseGeocode(newLat, newLng, controller.signal);

        // Guard against applying a stale result that arrived after cancellation.
        if (controller.signal.aborted) return;

        // Only fill fields the user has not manually edited.
        if (!dirtyFieldsRef.current.has("city") && result.city)
          setCity(result.city);
        if (!dirtyFieldsRef.current.has("district") && result.district)
          setDistrict(result.district);
        if (!dirtyFieldsRef.current.has("neighborhood") && result.neighborhood)
          setNeighborhood(result.neighborhood);
        if (!dirtyFieldsRef.current.has("street") && result.street)
          setStreet(result.street);
      } catch (err) {
        // AbortError = intentional cancellation — no action needed.
        if (err instanceof Error && err.name === "AbortError") return;
        // All other failures are non-fatal: coordinates are still saved normally.
        // Log for debugging; do not surface to the user to avoid confusion.
        console.warn("[LocationPicker] Reverse geocoding failed:", err);
      } finally {
        if (!controller.signal.aborted) setGeocoding(false);
      }
    };
  }); // intentionally no deps — must reflect latest state setters each render

  // ── Map init ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (mapRef.current || initializingRef.current || !containerRef.current)
      return;
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
        const newLat = parseFloat(pos.lat.toFixed(6));
        const newLng = parseFloat(pos.lng.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        // Map interaction signals intent for a fresh auto-fill.
        dirtyFieldsRef.current.clear();
        triggerGeocodeRef.current?.(newLat, newLng);
      });

      // Click on map moves marker and triggers geocoding.
      map.on("click", (e: L.LeafletMouseEvent) => {
        const newLat = parseFloat(e.latlng.lat.toFixed(6));
        const newLng = parseFloat(e.latlng.lng.toFixed(6));
        marker.setLatLng(e.latlng);
        setLat(newLat);
        setLng(newLng);
        // Map interaction signals intent for a fresh auto-fill.
        dirtyFieldsRef.current.clear();
        triggerGeocodeRef.current?.(newLat, newLng);
      });

      initializingRef.current = false;
    });

    return () => {
      initializingRef.current = false;
      geocodeAbortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
        street: street || undefined,
        addressDetails: addressDetails || undefined,
      });
      setSaved(true);
      router.refresh(); // re-fetch RSC so consultant panel and public page reflect changes
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  }

  // ── Manual coordinate inputs ──────────────────────────────────────────────
  //
  // Geocoding is debounced (700 ms) on manual input to avoid spamming
  // Nominatim while the user is still typing digits. Dirty fields are NOT
  // cleared here — the user may be fine-tuning coordinates while keeping
  // their manually-entered address.

  function handleLatChange(v: string) {
    const n = parseFloat(v);
    setLat(isNaN(n) ? lat : n);
    if (!isNaN(n) && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([n, lng]);
      mapRef.current.panTo([n, lng]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => triggerGeocodeRef.current?.(n, lng),
        700,
      );
    }
  }

  function handleLngChange(v: string) {
    const n = parseFloat(v);
    setLng(isNaN(n) ? lng : n);
    if (!isNaN(n) && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([lat, n]);
      mapRef.current.panTo([lat, n]);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => triggerGeocodeRef.current?.(lat, n),
        700,
      );
    }
  }

  // Mark a field as intentionally edited by the user.
  function markDirty(field: string) {
    dirtyFieldsRef.current.add(field);
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
        Adres bilgileri otomatik doldurulur; dilediğiniz gibi düzenleyebilirsiniz.
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
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-zinc-500">
            Adres Bilgileri
          </span>
          {geocoding && (
            <span className="text-xs text-blue-500 animate-pulse">
              Adres bulunuyor…
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              İl
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                markDirty("city");
              }}
              placeholder="Antalya"
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              İlçe
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                markDirty("district");
              }}
              placeholder="Konyaaltı"
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Mahalle
            </label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => {
                setNeighborhood(e.target.value);
                markDirty("neighborhood");
              }}
              placeholder="Liman"
              className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Cadde / Sokak
          </label>
          <input
            type="text"
            value={street}
            onChange={(e) => {
              setStreet(e.target.value);
              markDirty("street");
            }}
            placeholder="Atatürk Caddesi"
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="mt-3">
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Adres Detayı
          </label>
          <textarea
            rows={2}
            value={addressDetails}
            onChange={(e) => setAddressDetails(e.target.value)}
            placeholder="Daire No, Kat, Site / Bina Adı, Posta Kodu…"
            className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none resize-none"
          />
          <p className="mt-0.5 text-xs text-zinc-400">
            Bu alan harita seçiminde otomatik doldurulmaz; doğrudan siz girersiniz.
          </p>
        </div>
      </div>

      {saveError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {saveError}
        </p>
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
