import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  FEATURE_GROUPS,
  HEATING_TYPES,
  KITCHEN_STATES,
  LISTING_CATEGORIES,
  PROPERTY_TYPES,
} from '../taxonomy/constants';

class PriceDto {
  @ApiProperty({
    example: 2500000,
    description: 'Asking price (TRY)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ required: false, example: 'TRY', default: 'TRY' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ required: false, example: false })
  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;
}

class CoordinatesDto {
  @ApiProperty({ example: 36.8969 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 30.7133 })
  @IsNumber()
  longitude: number;
}

class LocationDto {
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

  @ApiProperty({ required: false, type: () => CoordinatesDto })
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;
}

class SpecificationsDto {
  @ApiProperty({
    required: false,
    example: 3,
    description: 'Room count (integer)',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  roomCount?: number;

  @ApiProperty({ required: false, example: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  bathroomCount?: number;

  @ApiProperty({
    required: false,
    example: 4,
    description: 'Floor the unit is on',
  })
  @IsInt()
  @IsOptional()
  floorNumber?: number;

  @ApiProperty({ required: false, example: 8, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  totalFloors?: number;

  @ApiProperty({
    required: false,
    example: 120,
    description: 'Gross area in m²',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  grossArea?: number;

  @ApiProperty({
    required: false,
    example: 105,
    description: 'Net area in m²',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  netArea?: number;

  @ApiProperty({
    required: false,
    example: 5,
    description: 'Building age in years',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  buildingAge?: number;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Has parking / car park',
  })
  @IsBoolean()
  @IsOptional()
  hasParking?: boolean;

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  hasBalcony?: boolean;

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
  @IsBoolean()
  @IsOptional()
  isFurnished?: boolean;

  @ApiProperty({ required: false, example: true })
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Inside a gated complex',
  })
  @IsBoolean()
  @IsOptional()
  inComplex?: boolean;

  @ApiProperty({
    required: false,
    example: true,
    description: 'Eligible for mortgage loan',
  })
  @IsBoolean()
  @IsOptional()
  isLoanEligible?: boolean;

  @ApiProperty({
    required: false,
    example: false,
    description: 'Open to swap / tradeoff',
  })
  @IsBoolean()
  @IsOptional()
  isSwapAvailable?: boolean;

  @ApiProperty({
    required: false,
    example: 500,
    description: 'Monthly dues (TRY)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  duesAmount?: number;
}

class DetailInfosDto {
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
}

export class CreateListingDto {
  @ApiProperty({
    example: 'Konyaaltı 3+1 Deniz Manzaralı Daire',
    description: 'Listing title',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiHideProperty()
  @IsString()
  @IsOptional()
  consultantId?: string;

  @ApiProperty({
    required: false,
    example: 'Merkezi ısıtmalı, 4. katta, asansörlü binada.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, type: () => PriceDto })
  @ValidateNested()
  @Type(() => PriceDto)
  @IsOptional()
  price?: PriceDto;

  @ApiProperty({
    required: false,
    enum: PROPERTY_TYPES,
    example: 'Konut',
    description: 'Taxonomy level-1 property type',
  })
  @IsIn(PROPERTY_TYPES)
  @IsOptional()
  propertyType?: string;

  @ApiProperty({
    required: false,
    example: 'Daire',
    description: 'Taxonomy level-2 subtype (e.g. Daire, Villa, Dükkan, Arsa)',
  })
  @IsString()
  @IsOptional()
  subtype?: string;

  @ApiProperty({
    required: false,
    enum: LISTING_CATEGORIES,
    example: 'SALE',
    description: 'SALE or RENT',
  })
  @IsIn(LISTING_CATEGORIES)
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, type: () => LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiProperty({ required: false, type: () => SpecificationsDto })
  @ValidateNested()
  @Type(() => SpecificationsDto)
  @IsOptional()
  specifications?: SpecificationsDto;

  @ApiProperty({ required: false, type: () => DetailInfosDto })
  @ValidateNested()
  @Type(() => DetailInfosDto)
  @IsOptional()
  detailInfos?: DetailInfosDto;

  @ApiProperty({
    required: false,
    example: 12,
    description: 'Number of uploaded images',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  imageCount?: number;
}
