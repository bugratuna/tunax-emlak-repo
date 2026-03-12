import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  FEATURE_GROUPS,
  HEATING_TYPES,
  KITCHEN_STATES,
  LISTING_CATEGORIES,
  LISTING_STATUSES,
  PROPERTY_TYPES,
} from '../taxonomy/constants';

const boolTransform = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class ListListingsDto {
  // ── Taxonomy ──────────────────────────────────────────────────────────────

  @ApiProperty({ required: false, enum: LISTING_CATEGORIES, example: 'SALE' })
  @IsIn(LISTING_CATEGORIES)
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, enum: PROPERTY_TYPES, example: 'Konut' })
  @IsIn(PROPERTY_TYPES)
  @IsOptional()
  propertyType?: string;

  @ApiProperty({
    required: false,
    example: 'Daire',
    description:
      'Exact subtype match. When combined with propertyType, must belong to that type. ' +
      'Sending filters blocked for this subtype returns 400 FILTER_NOT_ALLOWED_FOR_SUBTYPE.',
  })
  @IsString()
  @IsOptional()
  subtype?: string;

  @ApiProperty({
    required: false,
    enum: LISTING_STATUSES,
    example: 'PUBLISHED',
    description:
      'Lifecycle status filter. No default — returns all statuses when omitted.',
  })
  @IsIn(LISTING_STATUSES)
  @IsOptional()
  status?: string;

  // ── Price ─────────────────────────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: 500000,
    description:
      'Min price TRY (inclusive). Listings without a price are excluded.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({
    required: false,
    example: 5000000,
    description:
      'Max price TRY (inclusive). Listings without a price are excluded.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  // ── Area ──────────────────────────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: 80,
    description: 'Min gross area m²',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minM2Gross?: number;

  @ApiProperty({
    required: false,
    example: 250,
    description: 'Max gross area m²',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxM2Gross?: number;

  @ApiProperty({ required: false, example: 70, description: 'Min net area m²' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minM2Net?: number;

  @ApiProperty({
    required: false,
    example: 220,
    description: 'Max net area m²',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxM2Net?: number;

  // ── Property specs ────────────────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: 3,
    description: 'Exact room count (integer). Blocked for land subtypes → 400.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  roomCount?: number;

  @ApiProperty({
    required: false,
    example: '1+1,2+1,3+1',
    description:
      'Multi-select room counts as comma-separated display labels (e.g. "1+1,2+1"). ' +
      'Leading digit is extracted and matched against roomCount column (OR semantics).',
  })
  @IsString()
  @IsOptional()
  roomCounts?: string;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Exact bathroom count',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  bathroomCount?: number;

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Min building age (years)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  minBuildingAge?: number;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Max building age (years)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  maxBuildingAge?: number;

  @ApiProperty({
    required: false,
    example: 4,
    description: 'Exact floor number (can be negative for basement)',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  floorNumber?: number;

  @ApiProperty({
    required: false,
    example: 8,
    description: 'Exact total floors in building',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  totalFloors?: number;

  @ApiProperty({
    required: false,
    enum: HEATING_TYPES,
    example: 'Doğalgaz (Kombi)',
  })
  @IsIn(HEATING_TYPES)
  @IsOptional()
  heatingType?: string;

  @ApiProperty({
    required: false,
    enum: KITCHEN_STATES,
    example: 'Açık Mutfak',
  })
  @IsIn(KITCHEN_STATES)
  @IsOptional()
  kitchenState?: string;

  @ApiProperty({ required: false, example: true })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  carPark?: boolean;

  // ── Boolean flags ─────────────────────────────────────────────────────────

  @ApiProperty({ required: false, example: true })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @ApiProperty({ required: false, example: true })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  hasBalcony?: boolean;

  @ApiProperty({ required: false, example: true })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @ApiProperty({ required: false, example: true })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  inComplex?: boolean;

  @ApiProperty({ required: false, example: true })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  isLoanEligible?: boolean;

  @ApiProperty({ required: false, example: false })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  isSwapAvailable?: boolean;

  // ── Dues ──────────────────────────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Min monthly dues TRY',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minDues?: number;

  @ApiProperty({
    required: false,
    example: 1000,
    description: 'Max monthly dues TRY',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDues?: number;

  // ── Location ──────────────────────────────────────────────────────────────

  @ApiProperty({ required: false, example: 'Antalya' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false, example: 'Konyaaltı' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ required: false, example: 'Liman' })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiProperty({
    required: false,
    example: '30.5,36.7,31.1,37.2',
    description:
      'Bounding box: "minLng,minLat,maxLng,maxLat" (WGS84). ' +
      'Returns listings whose coordinates fall inside the box. ' +
      'Listings without coordinates are excluded. Backed by PostGIS GIST index on geom.',
  })
  @IsString()
  @IsOptional()
  bbox?: string;

  // ── Feature groups ────────────────────────────────────────────────────────
  // Use repeated params: ?view=Deniz+Manzarası&view=Göl+Manzarası
  // All selected values must match (AND within group, AND between groups).

  @ApiProperty({ required: false, enum: FEATURE_GROUPS.facades, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  facades?: string[];

  @ApiProperty({
    required: false,
    enum: FEATURE_GROUPS.interiorFeatures,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interiorFeatures?: string[];

  @ApiProperty({
    required: false,
    enum: FEATURE_GROUPS.exteriorFeatures,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  exteriorFeatures?: string[];

  @ApiProperty({
    required: false,
    enum: FEATURE_GROUPS.vicinity,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  vicinity?: string[];

  @ApiProperty({
    required: false,
    enum: FEATURE_GROUPS.transportation,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  transportation?: string[];

  @ApiProperty({ required: false, enum: FEATURE_GROUPS.view, isArray: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  view?: string[];

  @ApiProperty({
    required: false,
    enum: FEATURE_GROUPS.housingType,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  housingType?: string[];

  @ApiProperty({
    required: false,
    enum: FEATURE_GROUPS.accessibility,
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  accessibility?: string[];

  // ── Pagination & sort ─────────────────────────────────────────────────────

  @ApiProperty({ required: false, example: 1, minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  // ── Featured filter ───────────────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: true,
    description: 'Return only isFeatured=true listings.',
  })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Return only isShowcase=true (Vitrin) listings.',
  })
  @Transform(boolTransform)
  @IsBoolean()
  @IsOptional()
  isShowcase?: boolean;

  @ApiProperty({
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'oldest'],
    example: 'newest',
  })
  @IsIn(['price_asc', 'price_desc', 'newest', 'oldest'])
  @IsOptional()
  sortBy?: string;

  // ── Full-text search (admin) ───────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: 'deniz manzaralı',
    description:
      'Case-insensitive substring match against listing title. Admin endpoint only.',
  })
  @IsString()
  @IsOptional()
  search?: string;

  // ── Consultant filter ─────────────────────────────────────────────────────

  @ApiProperty({
    required: false,
    example: 'uuid-of-consultant',
    description:
      'Filter listings by consultant UUID. Used by consultant dashboard.',
  })
  @IsString()
  @IsOptional()
  consultantId?: string;
}
