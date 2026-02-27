/**
 * Shared form fields and state for CreateListingScreen and EditListingScreen.
 * Keeps both screens DRY without a form library.
 */

import { Category, CreateListingDto, Currency, PropertyType } from '../../types';
import { District } from '../../config';

export interface FormState {
  title: string;
  description: string;
  category: Category | '';
  propertyType: PropertyType | '';
  priceAmount: string;
  priceCurrency: Currency;
  priceNegotiable: boolean;
  squareMeters: string;
  roomCount: string;
  bathroomCount: string;
  district: District | '';
  neighborhood: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
}

export const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  category: '',
  propertyType: '',
  priceAmount: '',
  priceCurrency: 'TRY',
  priceNegotiable: false,
  squareMeters: '',
  roomCount: '',
  bathroomCount: '',
  district: '',
  neighborhood: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactEmail: '',
};

export type FormErrors = Partial<Record<keyof FormState, string>>;

export function validateForm(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.title.trim() || f.title.length < 10)
    e.title = 'Title must be at least 10 characters';
  if (f.title.length > 200)
    e.title = 'Title must be under 200 characters';
  if (!f.description.trim() || f.description.length < 50)
    e.description = 'Description must be at least 50 characters';
  if (f.description.length > 5000)
    e.description = 'Description must be under 5000 characters';
  if (!f.category)
    e.category = 'Category is required';
  if (!f.propertyType)
    e.propertyType = 'Property type is required';
  if (!f.priceAmount || isNaN(Number(f.priceAmount)) || Number(f.priceAmount) < 0)
    e.priceAmount = 'Enter a valid price';
  if (!f.squareMeters || isNaN(Number(f.squareMeters)) || Number(f.squareMeters) < 1)
    e.squareMeters = 'Enter a valid area (min 1)';
  if (f.roomCount === '' || isNaN(Number(f.roomCount)) || Number(f.roomCount) < 0)
    e.roomCount = 'Enter room count';
  if (f.bathroomCount === '' || isNaN(Number(f.bathroomCount)) || Number(f.bathroomCount) < 0)
    e.bathroomCount = 'Enter bathroom count';
  if (!f.district)
    e.district = 'District is required';
  if (!f.neighborhood.trim())
    e.neighborhood = 'Neighborhood is required';
  return e;
}

export function toDto(f: FormState, consultantId?: string): CreateListingDto {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    consultantId,
    category: f.category as Category,
    propertyType: f.propertyType as PropertyType,
    price: {
      amount: Number(f.priceAmount),
      currency: f.priceCurrency,
      isNegotiable: f.priceNegotiable,
    },
    specifications: {
      squareMeters: Number(f.squareMeters),
      roomCount: Number(f.roomCount),
      bathroomCount: Number(f.bathroomCount),
    },
    location: {
      city: 'Antalya',
      district: f.district,
      neighborhood: f.neighborhood.trim(),
    },
    contact: {
      phone: f.contactPhone.trim() || undefined,
      whatsapp: f.contactWhatsapp.trim() || undefined,
      email: f.contactEmail.trim() || undefined,
    },
  };
}
