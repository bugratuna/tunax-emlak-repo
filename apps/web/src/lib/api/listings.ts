import { apiFetch, ApiRequestError } from "./client";
import { getClientToken } from "@/lib/auth";
import type {
  Listing,
  ListAllResult,
  ListingCategory,
  ListingLocation,
  ListingPrice,
  ListingSpecifications,
  MediaItem,
  PropertyType,
} from "@/lib/types";

export interface CreateListingDto {
  title: string;
  consultantId?: string;
  description?: string;
  category?: ListingCategory;
  propertyType?: PropertyType;
  /** Taxonomy level-2 subtype (e.g. 'Daire', 'Villa'). */
  subtype?: string;
  price?: ListingPrice;
  location?: ListingLocation;
  specifications?: ListingSpecifications;
  /** Feature group selections (facades, interiorFeatures, etc.) */
  detailInfos?: Record<string, string[]>;
  imageCount?: number;
}

/**
 * All query params accepted by GET /api/listings.
 * Array fields (feature groups) use string[] — serialised as repeated params.
 * Boolean fields use the string "true" | "false" (backend boolTransform).
 */
export interface ListingsQueryParams {
  // taxonomy
  category?: string;
  propertyType?: string;
  subtype?: string;
  // price
  minPrice?: string;
  maxPrice?: string;
  // area
  minM2Gross?: string;
  maxM2Gross?: string;
  minM2Net?: string;
  maxM2Net?: string;
  // specs (exact match)
  roomCount?: string;
  /** Comma-separated room count display labels for multi-select, e.g. "1+1,2+1" */
  roomCounts?: string;
  bathroomCount?: string;
  floorNumber?: string;
  totalFloors?: string;
  // age
  minBuildingAge?: string;
  maxBuildingAge?: string;
  // select specs
  heatingType?: string;
  kitchenState?: string;
  // boolean flags ("true" | "false")
  carPark?: string;
  isFurnished?: string;
  hasBalcony?: string;
  hasElevator?: string;
  inComplex?: string;
  isLoanEligible?: string;
  isSwapAvailable?: string;
  // dues
  minDues?: string;
  maxDues?: string;
  // location
  district?: string;
  neighborhood?: string;
  /** "{minLng},{minLat},{maxLng},{maxLat}" — PostGIS GIST-indexed bbox */
  bbox?: string;
  // feature groups — repeated params e.g. ?view=A&view=B
  facades?: string[];
  interiorFeatures?: string[];
  exteriorFeatures?: string[];
  vicinity?: string[];
  transportation?: string[];
  view?: string[];
  housingType?: string[];
  accessibility?: string[];
  // sort & pagination
  sortBy?: string;
}

export async function listListings(params?: ListingsQueryParams): Promise<ListAllResult> {
  const qs = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        // Feature group arrays: use append() so each value is a separate param.
        // ?view=Deniz+Manzarası&view=Şehir+Manzarası
        for (const v of value) {
          if (v) qs.append(key, v);
        }
      } else {
        qs.set(key, value as string);
      }
    }
  }
  const query = qs.toString();
  return apiFetch<ListAllResult>(`/api/listings${query ? `?${query}` : ""}`);
}

export async function getListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`);
}

export async function createListing(dto: CreateListingDto): Promise<Listing> {
  return apiFetch<Listing>("/api/listings", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

/**
 * Resubmit a listing from NEEDS_CHANGES → PENDING_REVIEW.
 */
export async function resubmitListing(id: string): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}/resubmit`, {
    method: "PATCH",
  });
}

/**
 * Update a listing in NEEDS_CHANGES or DRAFT status (CONSULTANT only).
 * All fields are optional — only provided fields are updated.
 */
export async function updateListing(
  id: string,
  dto: Partial<CreateListingDto>,
): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

/**
 * Get admin feedback for a NEEDS_CHANGES listing (CONSULTANT — owner only).
 * Pass the server-side JWT token when calling from a Server Component.
 */
export async function getListingFeedback(
  id: string,
  token?: string,
): Promise<{ feedback: string | null }> {
  return apiFetch<{ feedback: string | null }>(`/api/listings/${id}/feedback`, {
    ...(token ? { _token: token } : {}),
  });
}

/**
 * Get consultant contact info for a published listing (public — no auth).
 */
export async function getListingContact(
  id: string,
): Promise<{ consultantName: string; phone: string | null }> {
  return apiFetch<{ consultantName: string; phone: string | null }>(
    `/api/listings/${id}/contact`,
  );
}

/**
 * Admin: toggle featured status for a listing.
 */
export async function setFeaturedListing(
  id: string,
  isFeatured: boolean,
  sortOrder?: number,
): Promise<Listing> {
  return apiFetch<Listing>(`/api/admin/listings/${id}/featured`, {
    method: "PATCH",
    body: JSON.stringify({ isFeatured, sortOrder }),
  });
}

// ---------------------------------------------------------------------------
// Photo management (multipart upload — bypasses apiFetch Content-Type header)
// ---------------------------------------------------------------------------

function apiBase(): string {
  const url =
    typeof window === "undefined"
      ? process.env.API_BASE_URL_SERVER ?? process.env.NEXT_PUBLIC_API_BASE_URL
      : process.env.NEXT_PUBLIC_API_BASE_URL;
  return (url ?? "").replace(/\/$/, "");
}

/**
 * Upload photos via multipart/form-data.
 * Bypasses apiFetch so the browser sets the correct Content-Type boundary.
 */
export async function uploadPhotos(
  listingId: string,
  files: File[],
): Promise<MediaItem[]> {
  const token = getClientToken();
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  const res = await fetch(`${apiBase()}/api/listings/${listingId}/photos`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: "Unknown",
    }));
    throw new ApiRequestError(res.status, body);
  }
  return res.json() as Promise<MediaItem[]>;
}

/** Delete a photo by ID (removes from S3 + DB). */
export async function deletePhoto(
  listingId: string,
  photoId: string,
): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(
    `/api/listings/${listingId}/photos/${photoId}`,
    { method: "DELETE" },
  );
}

/** Update the display order of photos for a listing. */
export async function reorderPhotos(
  listingId: string,
  order: string[],
): Promise<MediaItem[]> {
  return apiFetch<MediaItem[]>(`/api/listings/${listingId}/photos/order`, {
    method: "PATCH",
    body: JSON.stringify({ order }),
  });
}

// ---------------------------------------------------------------------------
// Location update
// ---------------------------------------------------------------------------

export interface UpdateLocationDto {
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  neighborhood?: string;
}

/** Update listing coordinates (and optionally address fields). */
export async function updateListingLocation(
  listingId: string,
  dto: UpdateLocationDto,
): Promise<Listing> {
  return apiFetch<Listing>(`/api/listings/${listingId}/location`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}
