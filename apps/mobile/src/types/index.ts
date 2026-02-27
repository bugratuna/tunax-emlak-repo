export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'NEEDS_CHANGES'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'ARCHIVED';

export type Category = 'RENT' | 'SALE';
export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'HOUSE'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OTHER';
export type Currency = 'TRY' | 'USD' | 'EUR';

export interface ListingPrice {
  amount: number;
  currency: Currency;
  isNegotiable: boolean;
}

export interface ListingSpecifications {
  squareMeters: number;
  roomCount: number;
  bathroomCount: number;
  floorNumber?: number;
  totalFloors?: number;
  buildYear?: number;
  furnished?: boolean;
  balcony?: boolean;
  parking?: boolean;
  elevator?: boolean;
  pool?: boolean;
  seaView?: boolean;
}

export interface ListingLocation {
  city: string;
  district: string;
  neighborhood: string;
  lat?: number;
  lng?: number;
  postalCode?: string;
  address?: string;
}

export interface ListingContact {
  phone?: string;
  email?: string;
  whatsapp?: string;
}

export interface ListingImage {
  url: string;
  order: number;
  storageKey?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  status: ListingStatus;
  consultantId?: string;
  price?: ListingPrice;
  category?: Category;
  propertyType?: PropertyType;
  specifications?: ListingSpecifications;
  location?: ListingLocation;
  contact?: ListingContact;
  images?: ListingImage[];
  moderationFeedback?: string; // populated when status = NEEDS_CHANGES
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateListingDto {
  title: string;
  description: string;
  consultantId?: string;
  category: Category;
  propertyType: PropertyType;
  price: ListingPrice;
  specifications: ListingSpecifications;
  location: ListingLocation;
  contact?: ListingContact;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'CONSULTANT' | 'ADMIN';
}

export interface PaginatedListings {
  items: Listing[];
  nextCursor?: string;
  total?: number;
}

export interface ListingsQuery {
  status?: ListingStatus;
  category?: Category;
  propertyType?: PropertyType;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  consultantId?: string;
  cursor?: string;
  limit?: number;
}
