import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class PriceDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isNegotiable?: boolean;
}

class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

class LocationDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsOptional()
  coordinates?: CoordinatesDto;
}

class SpecificationsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  roomCount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  bathroomCount?: number;

  @IsInt()
  @IsOptional()
  floorNumber?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  totalFloors?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  grossArea?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  netArea?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  buildingAge?: number;

  @IsBoolean()
  @IsOptional()
  hasParking?: boolean;

  @IsBoolean()
  @IsOptional()
  hasBalcony?: boolean;

  @IsString()
  @IsOptional()
  heatingType?: string;
}

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  consultantId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @ValidateNested()
  @Type(() => PriceDto)
  @IsOptional()
  price?: PriceDto;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ValidateNested()
  @Type(() => SpecificationsDto)
  @IsOptional()
  specifications?: SpecificationsDto;

  @IsInt()
  @Min(0)
  @IsOptional()
  imageCount?: number;
}
