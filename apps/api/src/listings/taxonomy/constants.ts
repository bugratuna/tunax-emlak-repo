/**
 * Single source of truth for all listing taxonomy.
 * Derived from categoryData.ts + detailedFeaturesData.ts + utils.ts.
 *
 * IMPORTANT: When the actual frontend taxonomy files (categoryData.ts,
 * detailedFeaturesData.ts, utils.ts) are available, reconcile these
 * constants against them before going to production.
 */

// ── Category (top-level) ─────────────────────────────────────────────────────
export const LISTING_CATEGORIES = ['SALE', 'RENT'] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

// ── Lifecycle status ─────────────────────────────────────────────────────────
export const LISTING_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'NEEDS_CHANGES',
  'PUBLISHED',
  'ARCHIVED',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

// ── Property types (taxonomy level 1) ────────────────────────────────────────
export const PROPERTY_TYPES = [
  'Konut',
  'İşyeri',
  'Arsa',
  'Turistik Tesis',
  'Devremülk',
  'Arazi',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

// ── Subtypes per property type (taxonomy level 2) ────────────────────────────
export const SUBTYPES_BY_PROPERTY_TYPE: Record<string, readonly string[]> = {
  Konut: ['Daire', 'Villa', 'Rezidans', 'Müstakil Ev', 'Yalı', 'Çiftlik Evi', 'Bungalov'],
  İşyeri: ['Dükkan', 'Ofis', 'Mağaza', 'Depo', 'Fabrika', 'Atölye', 'Akaryakıt İstasyonu'],
  Arsa: ['Arsa', 'Tarla', 'Bağ / Bahçe', 'Zeytinlik'],
  'Turistik Tesis': ['Otel', 'Apart Otel', 'Pansiyon', 'Tatil Köyü', 'Kamp Alanı'],
  Devremülk: ['Devremülk'],
  Arazi: ['Ham Arazi', 'İmarlı Arazi'],
};

// ── Room counts (from utils.ts roomCounts) ────────────────────────────────────
// Integer representation: 0 = Stüdyo/0+1, 1 = 1+0/1+1, 2 = 2+1, etc.
// The API stores and filters by integer. Presentation is handled by the frontend.
export const ROOM_COUNT_MIN = 0;
export const ROOM_COUNT_MAX = 20;

// ── Heating types (from utils.ts heatingTypes) ───────────────────────────────
export const HEATING_TYPES = [
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
export type HeatingType = (typeof HEATING_TYPES)[number];

// ── Kitchen states ────────────────────────────────────────────────────────────
export const KITCHEN_STATES = [
  'Açık Mutfak',
  'Kapalı Mutfak',
  'Amerikan Mutfak',
  'Ada Mutfak',
] as const;
export type KitchenState = (typeof KITCHEN_STATES)[number];

// ── Feature groups + options (from detailedFeaturesData.ts) ──────────────────
export const FEATURE_GROUPS = {
  facades: [
    'Kuzey',
    'Güney',
    'Doğu',
    'Batı',
    'Kuzeydoğu',
    'Kuzeybatı',
    'Güneydoğu',
    'Güneybatı',
  ],
  interiorFeatures: [
    'Parke Zemin',
    'Seramik Zemin',
    'Mermer Zemin',
    'Laminant Zemin',
    'Yerden Isıtma',
    'Duşakabin',
    'Küvet',
    'Jakuzi',
    'Ebeveyn Banyosu',
    'Giyinme Odası',
    'Çamaşır Odası',
    'Ankastre Mutfak',
    'Doğalgaz',
    'Çelik Kapı',
    'PVC Doğrama',
    'Alüminyum Doğrama',
    'Ahşap Doğrama',
    'Akıllı Ev Sistemi',
    'Asma Tavan',
    'Spot Aydınlatma',
    'Isı Yalıtımı',
    'Ses Yalıtımı',
  ],
  exteriorFeatures: [
    'Bahçe',
    'Teras',
    'Çatı Terası',
    'Fransız Balkon',
    'Garaj',
    'Kapalı Garaj',
    'Açık Otopark',
    'Kapalı Otopark',
    'Depo',
    'Kiler',
    'Güvenlik',
    '7/24 Güvenlik',
    'Kamera Sistemi',
    'Intercom',
    'Yüzme Havuzu',
    'Çocuk Havuzu',
    'Fitness Merkezi',
    'Sauna',
    'Türk Hamamı',
    'Tenis Kortu',
    'Basketbol Sahası',
    'Çocuk Parkı',
    'Sosyal Tesis',
    'Kafeterya',
    'Jeneratör',
  ],
  vicinity: [
    'İlkokul',
    'Ortaokul',
    'Lise',
    'Üniversite',
    'Hastane',
    'Klinik',
    'Eczane',
    'AVM',
    'Market',
    'Banka',
    'PTT',
    'Park',
    'Orman',
    'Sahil / Plaj',
    'Serbest Bölge',
  ],
  transportation: [
    'Metro',
    'Tramvay',
    'Metrobüs',
    'Otobüs',
    'Minibüs',
    'Dolmuş',
    'Taksi Durağı',
    'Havalimanı',
    'Tren İstasyonu',
    'Liman',
  ],
  view: [
    'Deniz Manzarası',
    'Göl Manzarası',
    'Orman Manzarası',
    'Şehir Manzarası',
    'Dağ Manzarası',
    'Havuz Manzarası',
    'Bahçe Manzarası',
    'Doğa Manzarası',
  ],
  housingType: [
    'Dubleks',
    'Tripleks',
    'Quadplex',
    'Çatı Katı Dubleks',
    'Bahçe Dubleks',
    'Tek Katlı',
    'Giriş Kat',
    'Zemin Kat',
    'Yüksek Giriş',
  ],
  accessibility: [
    'Engelli Erişimi',
    'Tekerlekli Sandalye Rampası',
    'Asansör',
    'Geniş Kapı',
    'Engelli WC',
  ],
} as const;

export type FeatureGroup = keyof typeof FEATURE_GROUPS;
export const FEATURE_GROUP_NAMES = Object.keys(FEATURE_GROUPS) as FeatureGroup[];

// O(1) lookup sets — built once at module load time
export const FEATURE_VALUES_SET: Record<FeatureGroup, Set<string>> = Object.fromEntries(
  FEATURE_GROUP_NAMES.map((g) => [g, new Set<string>(FEATURE_GROUPS[g] as readonly string[])]),
) as Record<FeatureGroup, Set<string>>;

// ── Conditional filter rules ──────────────────────────────────────────────────
// Maps subtype → list of ListListingsDto keys that are BLOCKED for that subtype.
// Sending a blocked filter returns 400 FILTER_NOT_ALLOWED_FOR_SUBTYPE.
//
// Convention: only non-obvious blocks are listed. Everything not blocked is allowed.

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
  // ── Arsa / land types ──────────────────────────────────────────────────────
  Arsa: LAND_BLOCKS,
  Tarla: LAND_BLOCKS,
  'Bağ / Bahçe': LAND_BLOCKS,
  Zeytinlik: LAND_BLOCKS,
  'Ham Arazi': LAND_BLOCKS,
  'İmarlı Arazi': LAND_BLOCKS,

  // ── Commercial / industrial ────────────────────────────────────────────────
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
  Atölye: ['roomCount', 'bathroomCount', 'isFurnished', 'hasBalcony', 'housingType', 'minDues', 'maxDues'],

  // ── Residential ────────────────────────────────────────────────────────────
  // Villa is a detached property — no floor_number in the traditional sense,
  // but we allow it since some multi-story villas distinguish floors.
  // No blocks for Daire, Rezidans, Ofis, Mağaza, Yalı, Müstakil Ev, Bungalov.
};
