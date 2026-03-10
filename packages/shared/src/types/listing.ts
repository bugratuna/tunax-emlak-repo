export type ListingStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'NEEDS_CHANGES'
  | 'ARCHIVED';

export type ListingCategory = 'SALE' | 'RENT';

export type SortBy = 'price_asc' | 'price_desc' | 'newest' | 'oldest';

export interface ListingLocation {
  listingId?: string;
  city: string;
  district: string;
  neighborhood: string;
  lat?: number;
  lng?: number;
}

export interface ListingMedia {
  id: string;
  listingId: string;
  publicUrl: string;
  s3Key?: string;
  order: number;
  isCover?: boolean;
  width?: number;
  height?: number;
  type?: 'IMAGE';
}

export interface Listing {
  id: string;
  listingNumber?: string;
  title: string;
  description: string;
  category: ListingCategory;
  propertyType: string;
  subtype?: string;

  priceAmount: number;
  priceCurrency: 'TRY';

  m2Gross?: number;
  m2Net?: number;
  roomCount?: string;
  bathroomCount?: number;
  floorNumber?: number;
  totalFloors?: number;
  buildingAge?: number;
  heatingType?: string;

  hasBalcony?: boolean;
  hasElevator?: boolean;
  isFurnished?: boolean;
  inComplex?: boolean;
  duesAmount?: number;

  isShowcase?: boolean;
  isFeatured?: boolean;

  consultantId: string;
  status: ListingStatus;

  location?: ListingLocation;
  media?: ListingMedia[];

  createdAt: string;
  updatedAt: string;
}

export interface ListingsPage {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
}

export interface ListingsFilters {
  category?: ListingCategory;
  propertyType?: string;
  subtype?: string;
  status?: ListingStatus;
  minPrice?: number;
  maxPrice?: number;
  minM2Gross?: number;
  maxM2Gross?: number;
  minM2Net?: number;
  maxM2Net?: number;
  roomCounts?: string;
  bathroomCount?: number;
  minBuildingAge?: number;
  maxBuildingAge?: number;
  heatingType?: string;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  isFurnished?: boolean;
  inComplex?: boolean;
  city?: string;
  district?: string;
  neighborhood?: string;
  bbox?: string;
  isFeatured?: boolean;
  isShowcase?: boolean;
  consultantId?: string;
  sortBy?: SortBy;
  page?: number;
  limit?: number;
}

export interface CreateListingDto {
  title: string;
  description: string;
  category: ListingCategory;
  propertyType: string;
  subtype?: string;
  priceAmount: number;
  priceCurrency?: 'TRY';
  m2Gross?: number;
  m2Net?: number;
  roomCount?: string;
  bathroomCount?: number;
  floorNumber?: number;
  totalFloors?: number;
  buildingAge?: number;
  heatingType?: string;
  hasBalcony?: boolean;
  hasElevator?: boolean;
  isFurnished?: boolean;
  inComplex?: boolean;
  duesAmount?: number;
}
