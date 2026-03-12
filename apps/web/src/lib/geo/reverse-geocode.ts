/**
 * Reverse-geocoding via the AREP backend proxy endpoint.
 *
 * The browser calls `GET /api/listings/geocode/reverse?lat=X&lng=Y` which
 * proxies the request to Nominatim server-side. This keeps the OSM User-Agent
 * policy satisfied (single, identifiable origin) and prevents the browser
 * from contacting Nominatim directly.
 *
 * Normalization logic is consistent with neighborhood-combobox.tsx.
 */

import { apiFetch } from "@/lib/api/client";
import { DISTRICTS, NEIGHBORHOODS } from "./antalya";

// ── Public types ─────────────────────────────────────────────────────────────

export interface GeocodedAddress {
  /** "Antalya" when in Antalya province; raw city otherwise. */
  city: string;
  /** Canonical district name (from DISTRICTS) or cleaned Nominatim value. */
  district?: string;
  /** Canonical neighborhood name (from NEIGHBORHOODS) or cleaned Nominatim value. */
  neighborhood?: string;
  /** Street/road name from OSM (no whitelist — free text). */
  street?: string;
}

// ── Nominatim response shape (subset relevant to Turkey) ─────────────────────

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  village?: string;
  town?: string;
  municipality?: string;
  city_district?: string;
  county?: string;
  city?: string;
  province?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  error?: string;
}

// ── Normalization helpers ─────────────────────────────────────────────────────

/**
 * Same Turkish-aware normalization as neighborhood-combobox.tsx.
 * Ensures canonical lookups are consistent across the app.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ş/g, "s")
    .replace(/İ/g, "i")
    .replace(/Ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/Ç/g, "c")
    .trim();
}

/**
 * Strips Turkish district suffixes ("İlçesi", "İlçe") then attempts a
 * canonical match against DISTRICTS. Falls back to the cleaned raw value
 * so the field is still pre-populated for the consultant to verify.
 */
function resolveDistrict(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/\s+[İi]l[çc]esi\s*$/i, "")
    .replace(/\s+[İi]l[çc]e\s*$/i, "")
    .trim();
  const norm = normalize(cleaned);
  return DISTRICTS.find((d) => normalize(d) === norm) ?? cleaned;
}

/**
 * Strips "Mahallesi" / "Mah." suffixes then attempts a canonical match
 * against the resolved district's NEIGHBORHOODS list first, then all
 * neighborhoods. Falls back to the cleaned raw value.
 */
function resolveNeighborhood(
  raw: string | undefined,
  district: string | undefined,
): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/\s+[Mm]ahallesi\s*$/i, "")
    .replace(/\s+[Mm]ah\.\s*$/i, "")
    .trim();
  const norm = normalize(cleaned);

  const allNeighborhoods = NEIGHBORHOODS as Record<string, string[]>;

  // Prefer the resolved district's list for a faster, more accurate match
  if (district) {
    const pool = allNeighborhoods[district] ?? [];
    const match = pool.find((n) => normalize(n) === norm);
    if (match) return match;
  }

  // Fall back: search the full neighborhood table
  const everywhere = Object.values(allNeighborhoods).flat();
  return everywhere.find((n) => normalize(n) === norm) ?? cleaned;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Reverse-geocodes WGS84 coordinates via the backend proxy.
 *
 * Throws on network failure or non-2xx HTTP — callers must handle this
 * gracefully (coordinates should still be saved; address is best-effort).
 *
 * @param lat  latitude in decimal degrees
 * @param lng  longitude in decimal degrees
 * @param signal  AbortSignal for cancelling stale requests
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<GeocodedAddress> {
  const data = await apiFetch<NominatimResponse>(
    `/api/listings/geocode/reverse?lat=${lat}&lng=${lng}`,
    { signal },
  );

  if (data.error || !data.address) {
    throw new Error(data.error ?? "Empty response from geocoder");
  }

  const a = data.address;

  // City: normalize to "Antalya" whenever we're in Antalya province
  const city =
    a.state === "Antalya" || a.province === "Antalya" || a.city === "Antalya"
      ? "Antalya"
      : (a.city ?? a.town ?? a.state ?? "");

  // District (ilçe): city_district is most specific for Turkish administrative
  // boundaries; county / town are fallbacks. Skip "Antalya" — that's the
  // province, not a district.
  const districtCandidates = [a.city_district, a.county, a.town, a.municipality];
  const districtRaw = districtCandidates.find(
    (c) => c && normalize(c) !== "antalya",
  );
  const district = resolveDistrict(districtRaw);

  // Neighborhood (mahalle): Nominatim uses neighbourhood/suburb/quarter
  const neighborhoodRaw =
    a.neighbourhood ?? a.suburb ?? a.quarter ?? a.village;
  const neighborhood = resolveNeighborhood(neighborhoodRaw, district);

  // Street: road is primary; pedestrian/footway for car-free zones
  const street = (a.road ?? a.pedestrian ?? a.footway ?? a.path)?.trim();

  return { city, district, neighborhood, street: street || undefined };
}
