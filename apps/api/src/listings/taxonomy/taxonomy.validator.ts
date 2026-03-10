import { BadRequestException } from '@nestjs/common';
import {
  BLOCKED_FILTERS_BY_SUBTYPE,
  FEATURE_GROUP_NAMES,
  FEATURE_VALUES_SET,
  SUBTYPES_BY_PROPERTY_TYPE,
} from './constants';

/** Thrown when a filter param is not valid for the requested subtype. */
export interface FilterNotAllowedError {
  error: 'FILTER_NOT_ALLOWED_FOR_SUBTYPE';
  message: string;
  disallowed: string[];
  subtype: string;
}

/**
 * Stage 1: validate that (propertyType, subtype) is a known taxonomy pair.
 * Stage 2: reject any filter keys that are blocked for the given subtype.
 *
 * @param dto   The full ListListingsDto (after class-validator has already run)
 * @throws BadRequestException with { error, disallowed, subtype } payload
 */
export function validateConditionalFilters(dto: Record<string, unknown>): void {
  const propertyType = dto['propertyType'] as string | undefined;
  const subtype = dto['subtype'] as string | undefined;

  // Validate that subtype belongs to propertyType (when both are present)
  if (propertyType && subtype) {
    const allowed = SUBTYPES_BY_PROPERTY_TYPE[propertyType];
    if (!allowed) {
      throw new BadRequestException(
        `Unknown propertyType "${propertyType}". Known types: ${Object.keys(SUBTYPES_BY_PROPERTY_TYPE).join(', ')}`,
      );
    }
    if (!allowed.includes(subtype)) {
      throw new BadRequestException(
        `Subtype "${subtype}" is not valid for propertyType "${propertyType}". ` +
          `Allowed subtypes: ${allowed.join(', ')}`,
      );
    }
  }

  // Check blocked filters
  if (subtype) {
    const blocked = BLOCKED_FILTERS_BY_SUBTYPE[subtype];
    if (blocked && blocked.length > 0) {
      // Collect all filter keys that are present (non-undefined) in the DTO
      const sentKeys = Object.keys(dto).filter(
        (k) =>
          dto[k] !== undefined &&
          dto[k] !== null &&
          k !== 'propertyType' &&
          k !== 'subtype',
      );
      const disallowed = sentKeys.filter((k) => blocked.includes(k));
      if (disallowed.length > 0) {
        const body: FilterNotAllowedError = {
          error: 'FILTER_NOT_ALLOWED_FOR_SUBTYPE',
          message:
            `The following filters are not applicable for subtype "${subtype}": ` +
            disallowed.join(', '),
          disallowed,
          subtype,
        };
        throw new BadRequestException(body);
      }
    }
  }
}

/**
 * Validate that all feature group values sent in the filter exist in the taxonomy.
 */
export function validateFeatureValues(dto: Record<string, unknown>): void {
  for (const group of FEATURE_GROUP_NAMES) {
    const values = dto[group];
    if (!values) continue;
    const arr = Array.isArray(values) ? values : [values];
    const allowed = FEATURE_VALUES_SET[group];
    const invalid = (arr as string[]).filter((v) => !allowed.has(v));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid values for feature group "${group}": ${invalid.join(', ')}. ` +
          `Allowed values: ${Array.from(allowed).join(', ')}`,
      );
    }
  }
}
