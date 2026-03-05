/**
 * Re-exports from the local taxonomy data files.
 * These are the canonical frontend taxonomy definitions.
 *
 * NOTE: heatingType values in utils.ts differ from the backend's
 * taxonomy/constants.ts HEATING_TYPES. The HEATING_TYPES export in index.ts
 * uses the backend-compatible values until the backend is reconciled.
 */

// Three-level category hierarchy: cat1 → cat2 → cat3 (subtype + schema)
export { categories } from './data/categoryData';

// Detailed feature group options per group (facades, interiorFeatures, etc.)
export { detailedFeatures } from './data/detailedFeaturesData';

// Utility arrays for form dropdowns and filter chips
export {
  roomCounts,
  floors,
  totalFloors,
  heatingTypes,
  buildingAges,
  statuses,
  bathroomCounts,
  twoStateBoolean,
  carParks,
  titleDeedStatuses,
  constructionTypes,
} from './data/utils';
