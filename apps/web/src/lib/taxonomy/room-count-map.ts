import { roomCounts } from './source';

/**
 * Curated chip options for the /listings filter sidebar.
 * These are the most common room configurations; the full list (44 entries)
 * would be impractical as filter chips.
 */
export const ROOM_COUNT_CHIP_OPTIONS: string[] = [
  'Stüdyo (1+0)',
  '1+1',
  '2+1',
  '2+2',
  '3+1',
  '3+2',
  '4+1',
  '4+2',
  '5+1',
  '6+1',
].filter((l) => roomCounts.includes(l));

/**
 * Returns the sequential index of a roomCount display string.
 * Index 0 = 'Stüdyo (1+0)', 1 = '1+1', 2 = '1.5+1', etc.
 * Returns -1 if not found.
 *
 * NOTE: The backend stores roomCount as an integer. This index-based
 * mapping is only correct if the backend and frontend were aligned when
 * the listing was created. Use for client-side filtering only.
 */
export function roomCountLabelToIdx(label: string): number {
  return roomCounts.indexOf(label);
}
