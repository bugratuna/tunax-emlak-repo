/**
 * Frontend taxonomy module — single source of truth for all UI taxonomy.
 *
 * Data sources:
 *   - mnt/data/categoryData.ts    → cat1/cat2/cat3 hierarchy
 *   - mnt/data/detailedFeaturesData.ts → feature group options (form/filter)
 *   - mnt/data/utils.ts           → roomCounts, buildingAges, etc.
 *
 * HEATING_TYPES: kept backend-compatible (backend validates with @IsIn).
 * The utils.ts heatingTypes use different labels — reconcile before production.
 */

import {
  categories,
  detailedFeatures,
  roomCounts,
  buildingAges,
  statuses,
  bathroomCounts,
  carParks,
  titleDeedStatuses,
  constructionTypes,
  floors,
  totalFloors,
  twoStateBoolean,
} from './source';

// ── Re-export source data ─────────────────────────────────────────────────────

export { categories, detailedFeatures };
export {
  roomCounts as ROOM_COUNTS_RAW,
  buildingAges as BUILDING_AGES,
  statuses as STATUSES,
  bathroomCounts as BATHROOM_COUNTS,
  carParks as CAR_PARKS,
  titleDeedStatuses as TITLE_DEED_STATUSES,
  constructionTypes as CONSTRUCTION_TYPES,
  floors as FLOORS,
  totalFloors as TOTAL_FLOORS,
  twoStateBoolean as TWO_STATE_BOOLEAN,
};

// ── Schema helpers ────────────────────────────────────────────────────────────

export {
  CAT1_OPTIONS,
  getCat2Options,
  getCat3Options,
  getSchema,
  isNestedCat,
} from './schema';
export type { SubtypeEntry } from './schema';

// ── Category → backend param mapping ─────────────────────────────────────────

export { cat2ToCategory } from './listing-type-map';

// ── Room count ────────────────────────────────────────────────────────────────

export { ROOM_COUNT_CHIP_OPTIONS, roomCountLabelToIdx } from './room-count-map';

// ── Feature groups (derived from detailedFeatures, sentinels stripped) ────────

/** Strip "I don't want to select" sentinel options. */
function noSentinel(opts: readonly string[]): string[] {
  return opts.filter((o) => !o.includes('istemiyorum'));
}

/**
 * Feature group option arrays (sentinels removed).
 * Includes all groups from detailedFeaturesData (facades, interiorFeatures,
 * exteriorFeatures, siding, vicinity, transportation, view, housingType,
 * housingProps, accessibility, decoration).
 */
export const FEATURE_GROUPS: Record<string, string[]> = Object.fromEntries(
  Object.entries(detailedFeatures).map(([k, { options }]) => [
    k,
    noSentinel(options),
  ]),
);

export type FeatureGroup = keyof typeof detailedFeatures;
export const FEATURE_GROUP_NAMES: FeatureGroup[] = Object.keys(
  detailedFeatures,
) as FeatureGroup[];

/** Turkish display label for each feature group. */
export const FEATURE_GROUP_LABELS: Record<FeatureGroup, string> =
  Object.fromEntries(
    Object.entries(detailedFeatures).map(([k, { title }]) => [k, title]),
  ) as Record<FeatureGroup, string>;

/**
 * Feature groups accepted by GET /api/listings as query params.
 * Subset of FEATURE_GROUP_NAMES — only what the backend filter supports.
 */
export const FILTER_FEATURE_GROUP_NAMES: FeatureGroup[] = [
  'facades',
  'interiorFeatures',
  'exteriorFeatures',
  'vicinity',
  'transportation',
  'view',
  'housingType',
  'accessibility',
];

// ── Property types (from categoryData hierarchy) ──────────────────────────────

export const PROPERTY_TYPES: string[] = Object.keys(categories);

type CatEntry = { name: string };

/**
 * All unique subtype names per property type.
 * Shape A (nested): union of all cat3 names across all cat2 options.
 * Shape B (flat): empty (cat2 IS the final selection level).
 */
export const SUBTYPES_BY_PROPERTY_TYPE: Record<string, string[]> =
  Object.fromEntries(
    PROPERTY_TYPES.map((pt) => {
      const v = categories[pt as keyof typeof categories];
      if (!v || Array.isArray(v)) return [pt, []];
      const nested = v as Record<string, CatEntry[]>;
      const unique = [
        ...new Set(
          Object.values(nested)
            .flat()
            .map((e) => e.name),
        ),
      ];
      return [pt, unique];
    }),
  );

// ── Kitchen states ────────────────────────────────────────────────────────────

export const KITCHEN_STATES: readonly string[] = [
  'Açık Mutfak',
  'Kapalı Mutfak',
  'Amerikan Mutfak',
  'Ada Mutfak',
] as const;

// ── Heating types (backend-compatible — different from utils.ts heatingTypes) ─
// TODO: reconcile utils.ts heatingTypes with backend HEATING_TYPES before production

export const HEATING_TYPES: readonly string[] = [
  'Doğalgaz (Kombi)',
  'Doğalgaz (Merkezi)',
  'Doğalgaz (Merkezi Pay Ölçer)',
  'Isı Pompası',
  'Elektrik',
  'Soba',
  'Kat Kaloriferi',
  'Klima',
  'Güneş Enerjisi',
  'Yerden Isıtma',
  'Yok',
] as const;

// ── Room count options ────────────────────────────────────────────────────────

/** Full room count list for form dropdowns (44 entries from utils.ts). */
export const ROOM_COUNT_OPTIONS: { value: number; label: string }[] =
  roomCounts.map((label, value) => ({ value, label }));

// ── Blocked filter keys per subtype (mirrors backend BLOCKED_FILTERS_BY_SUBTYPE) ──

const LAND_BLOCKS = [
  'roomCount',
  'bathroomCount',
  'floorNumber',
  'totalFloors',
  'minBuildingAge',
  'maxBuildingAge',
  'heatingType',
  'kitchenState',
  'isFurnished',
  'hasBalcony',
  'hasElevator',
  'inComplex',
  'minDues',
  'maxDues',
  'interiorFeatures',
  'housingType',
] as const;

export const BLOCKED_FILTERS_BY_SUBTYPE: Record<string, readonly string[]> = {
  Arsa: LAND_BLOCKS,
  Tarla: LAND_BLOCKS,
  'Bağ / Bahçe': LAND_BLOCKS,
  Zeytinlik: LAND_BLOCKS,
  'Ham Arazi': LAND_BLOCKS,
  'İmarlı Arazi': LAND_BLOCKS,
  Dükkan: ['roomCount', 'isFurnished', 'housingType', 'minDues', 'maxDues'],
  Depo: [
    'roomCount',
    'bathroomCount',
    'heatingType',
    'kitchenState',
    'isFurnished',
    'hasBalcony',
    'hasElevator',
    'housingType',
    'minDues',
    'maxDues',
  ],
  Fabrika: [
    'roomCount',
    'bathroomCount',
    'heatingType',
    'kitchenState',
    'isFurnished',
    'hasBalcony',
    'hasElevator',
    'housingType',
    'minDues',
    'maxDues',
  ],
  Atölye: [
    'roomCount',
    'bathroomCount',
    'isFurnished',
    'hasBalcony',
    'housingType',
    'minDues',
    'maxDues',
  ],
};

/** Returns the set of URL param keys that must be hidden/omitted for this subtype. */
export function getBlockedFilters(subtype: string | undefined): Set<string> {
  if (!subtype) return new Set();
  return new Set(BLOCKED_FILTERS_BY_SUBTYPE[subtype] ?? []);
}

/** Returns true if `field` must be hidden for the given subtype. */
export function isBlocked(
  subtype: string | undefined,
  field: string,
): boolean {
  return getBlockedFilters(subtype).has(field);
}

/** Returns the valid subtypes for the given propertyType, or [] if none. */
export function getSubtypes(
  propertyType: string | undefined,
): readonly string[] {
  if (!propertyType) return [];
  return SUBTYPES_BY_PROPERTY_TYPE[propertyType] ?? [];
}
