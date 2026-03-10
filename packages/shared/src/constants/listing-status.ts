import type { ListingStatus } from '../types';

export const LISTING_STATUSES: ListingStatus[] = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'NEEDS_CHANGES',
  'ARCHIVED',
];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  DRAFT: 'Taslak',
  PENDING: 'İnceleme Bekliyor',
  APPROVED: 'Yayında',
  REJECTED: 'Reddedildi',
  NEEDS_CHANGES: 'Düzenleme Gerekiyor',
  ARCHIVED: 'Arşivlendi',
};

export const LISTING_STATUS_COLORS: Record<ListingStatus, string> = {
  DRAFT: '#757575',
  PENDING: '#f57c00',
  APPROVED: '#2e7d32',
  REJECTED: '#6a1a1a',
  NEEDS_CHANGES: '#c62828',
  ARCHIVED: '#455a64',
};
