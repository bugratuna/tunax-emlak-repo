/** Maps cat2 display string → backend `category` query param value. */
const CAT2_TO_CATEGORY: Record<string, 'SALE' | 'RENT'> = {
  Satılık: 'SALE',
  Kiralık: 'RENT',
};

export function cat2ToCategory(cat2: string): 'SALE' | 'RENT' | undefined {
  return CAT2_TO_CATEGORY[cat2];
}
