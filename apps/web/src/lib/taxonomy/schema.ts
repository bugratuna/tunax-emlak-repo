/**
 * Schema resolution helpers for the category hierarchy from categoryData.ts.
 *
 * Two structure shapes exist:
 *   Shape A (nested): categories[cat1] = { [cat2]: SubtypeEntry[] }
 *     e.g. Konut → { Satılık: [...], Kiralık: [...] }
 *   Shape B (flat array): categories[cat1] = SubtypeEntry[]
 *     e.g. Arsa → [{ name: 'Satılık' }, { name: 'Kiralık' }, ...]
 *
 * For Shape A: cat1 → cat2 (transaction type) → cat3 (subtype/name)
 * For Shape B: cat1 → cat2 (which IS the final name, no cat3 level)
 */

import { categories } from './source';

export type SubtypeEntry = {
  name: string;
  emlakProp: string[] | null;
  otherProps: string[] | null;
  detailInfos: Array<{ title: string; options: readonly string[] }> | null;
};

type ShapeA = Record<string, SubtypeEntry[]>;
type ShapeB = SubtypeEntry[];

// Cast to generic Record to work with both shapes
const cats = categories as unknown as Record<string, ShapeA | ShapeB>;

function isShapeA(v: ShapeA | ShapeB): v is ShapeA {
  return !Array.isArray(v);
}

/** All cat1 (propertyType) keys. */
export const CAT1_OPTIONS: string[] = Object.keys(categories);

/** True if cat1 uses Shape A (nested cat2 → cat3 structure). */
export function isNestedCat(cat1: string): boolean {
  const v = cats[cat1];
  return !!v && isShapeA(v);
}

/**
 * Returns the cat2 options for a given cat1.
 * Shape A: transaction type keys (e.g. 'Satılık', 'Kiralık')
 * Shape B: subtype names (they ARE the options at this level)
 */
export function getCat2Options(cat1: string): string[] {
  const v = cats[cat1];
  if (!v) return [];
  if (isShapeA(v)) return Object.keys(v);
  return (v as SubtypeEntry[]).map((e) => e.name);
}

/**
 * Returns the cat3 options for a given cat1+cat2 (Shape A only).
 * Returns [] for Shape B categories.
 */
export function getCat3Options(cat1: string, cat2: string): string[] {
  const v = cats[cat1];
  if (!v || !isShapeA(v)) return [];
  return ((v as ShapeA)[cat2] ?? []).map((e) => e.name);
}

/**
 * Returns the schema entry for a given cat1+cat2+cat3.
 * Shape A: looks up cat3 in the cat2 array.
 * Shape B: looks up by cat2 name (no cat3 needed).
 * Returns null if not found.
 */
export function getSchema(
  cat1: string,
  cat2: string,
  cat3?: string,
): SubtypeEntry | null {
  const v = cats[cat1];
  if (!v) return null;
  if (isShapeA(v)) {
    if (!cat3) return null;
    return (v as ShapeA)[cat2]?.find((e) => e.name === cat3) ?? null;
  }
  return (v as SubtypeEntry[]).find((e) => e.name === cat2) ?? null;
}
