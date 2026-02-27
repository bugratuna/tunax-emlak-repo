// MOBILE_API_BASE_URL is set via EXPO_PUBLIC_API_BASE_URL in .env
// Falls back to localhost for local development
export const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export const DISTRICTS = [
  'Muratpaşa',
  'Kepez',
  'Konyaaltı',
  'Döşemealtı',
  'Aksu',
  'Alanya',
  'Manavgat',
  'Serik',
  'Kemer',
  'Kumluca',
  'Finike',
  'Kaş',
  'Demre',
  'Elmalı',
  'Korkuteli',
  'Akseki',
  'Gündoğmuş',
  'İbradı',
  'Gazipaşa',
] as const;

export type District = (typeof DISTRICTS)[number];
