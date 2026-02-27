import { apiFetch } from "./client";
import type {
  Listing,
  ListingCategory,
  ListingLocation,
  ListingPrice,
  ListingSpecifications,
  PropertyType,
} from "@/lib/types";

export interface CreateListingDto {
  title: string;
  consultantId?: string;
  description?: string;
  category?: ListingCategory;
  propertyType?: PropertyType;
  price?: ListingPrice;
  location?: ListingLocation;
  specifications?: ListingSpecifications;
  imageCount?: number;
}

export async function listListings(): Promise<Listing[]> {
  return apiFetch<Listing[]>("/api/listings");
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
