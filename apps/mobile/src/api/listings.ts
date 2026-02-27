// Endpoints implemented in API:
//   GET  /api/listings/:id         ✓
//   POST /api/listings              ✓ (title + consultantId only — full DTO pending)
//   PATCH /api/listings/:id/resubmit ✓
//
// Endpoints NOT YET implemented in API:
//   GET  /api/listings              TODO: list with filters + pagination
//   PATCH /api/listings/:id         TODO: field update
//   POST /api/listings/:id/submit   TODO: DRAFT → PENDING_REVIEW

import { apiClient } from './client';
import { CreateListingDto, Listing, ListingsQuery, PaginatedListings } from '../types';

export async function getListings(query: ListingsQuery = {}): Promise<PaginatedListings> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.category) params.set('category', query.category);
  if (query.propertyType) params.set('propertyType', query.propertyType);
  if (query.district) params.set('district', query.district);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.consultantId) params.set('consultantId', query.consultantId);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit !== undefined) params.set('limit', String(query.limit));

  const qs = params.toString();
  return apiClient.get<PaginatedListings>(`/api/listings${qs ? `?${qs}` : ''}`);
}

export async function getListing(id: string): Promise<Listing> {
  return apiClient.get<Listing>(`/api/listings/${id}`);
}

export async function createListing(dto: CreateListingDto): Promise<Listing> {
  return apiClient.post<Listing>('/api/listings', dto, true);
}

export async function updateListing(id: string, dto: Partial<CreateListingDto>): Promise<Listing> {
  // TODO: PATCH /api/listings/:id not yet implemented
  return apiClient.patch<Listing>(`/api/listings/${id}`, dto, true);
}

export async function submitListing(id: string): Promise<Listing> {
  // TODO: POST /api/listings/:id/submit not yet implemented
  // Falls back to resubmit endpoint which does exist
  return apiClient.post<Listing>(`/api/listings/${id}/submit`, {}, true);
}

export async function resubmitListing(id: string): Promise<Listing> {
  return apiClient.patch<Listing>(`/api/listings/${id}/resubmit`, {}, true);
}
