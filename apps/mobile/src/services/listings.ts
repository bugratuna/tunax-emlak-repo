import type { Listing, ListingsFilters, ListingsPage } from '@tunax/shared';
import { apiClient } from './client';

/**
 * Fetch a paginated listing feed.
 *
 * Pagination is offset/page-based (not cursor-based).
 * Backend returns: { data: Listing[], total: number, page: number, limit: number }
 *
 * TanStack Query useInfiniteQuery usage:
 *   initialPageParam: 1
 *   getNextPageParam: (lastPage) =>
 *     lastPage.page * lastPage.limit < lastPage.total
 *       ? lastPage.page + 1
 *       : undefined
 */
export async function getListings(filters: ListingsFilters = {}): Promise<ListingsPage> {
  const params = new URLSearchParams();

  if (filters.category) params.set('category', filters.category);
  if (filters.propertyType) params.set('propertyType', filters.propertyType);
  if (filters.subtype) params.set('subtype', filters.subtype);
  if (filters.status) params.set('status', filters.status);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minM2Gross != null) params.set('minM2Gross', String(filters.minM2Gross));
  if (filters.maxM2Gross != null) params.set('maxM2Gross', String(filters.maxM2Gross));
  if (filters.minM2Net != null) params.set('minM2Net', String(filters.minM2Net));
  if (filters.maxM2Net != null) params.set('maxM2Net', String(filters.maxM2Net));
  if (filters.roomCounts) params.set('roomCounts', filters.roomCounts);
  if (filters.bathroomCount != null) params.set('bathroomCount', String(filters.bathroomCount));
  if (filters.heatingType) params.set('heatingType', filters.heatingType);
  if (filters.hasBalcony != null) params.set('hasBalcony', String(filters.hasBalcony));
  if (filters.hasElevator != null) params.set('hasElevator', String(filters.hasElevator));
  if (filters.isFurnished != null) params.set('isFurnished', String(filters.isFurnished));
  if (filters.inComplex != null) params.set('inComplex', String(filters.inComplex));
  if (filters.city) params.set('city', filters.city);
  if (filters.district) params.set('district', filters.district);
  if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);
  if (filters.bbox) params.set('bbox', filters.bbox);
  if (filters.isFeatured != null) params.set('isFeatured', String(filters.isFeatured));
  if (filters.isShowcase != null) params.set('isShowcase', String(filters.isShowcase));
  if (filters.consultantId) params.set('consultantId', filters.consultantId);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);

  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));

  const res = await apiClient.get<ListingsPage>(`/api/listings?${params.toString()}`);
  return res.data;
}

export async function getListing(id: string): Promise<Listing> {
  const res = await apiClient.get<Listing>(`/api/listings/${id}`);
  return res.data;
}

export async function resubmitListing(id: string): Promise<Listing> {
  const res = await apiClient.patch<Listing>(`/api/listings/${id}/resubmit`, {});
  return res.data;
}

export async function unpublishListing(id: string): Promise<Listing> {
  const res = await apiClient.patch<Listing>(`/api/listings/${id}/unpublish`, {});
  return res.data;
}
