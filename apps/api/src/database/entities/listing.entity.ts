import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingFeatureEntity } from './listing-feature.entity';
import { ListingLocationEntity } from './listing-location.entity';
import { ListingMediaEntity } from './listing-media.entity';

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'NEEDS_CHANGES'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type ListingCategory = 'SALE' | 'RENT';

@Entity('listings')
export class ListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'title', type: 'varchar', length: 500 })
  title: string;

  @Column({ name: 'consultant_id', type: 'uuid' })
  consultantId: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'PENDING_REVIEW' })
  status: ListingStatus;

  @Column({ name: 'category', type: 'varchar', length: 20, nullable: true })
  category: ListingCategory | null;

  @Column({ name: 'property_type', type: 'varchar', length: 100, nullable: true })
  propertyType: string | null;

  @Column({ name: 'listing_type', type: 'varchar', length: 100, nullable: true })
  listingType: string | null;

  @Column({ name: 'subtype', type: 'varchar', length: 100, nullable: true })
  subtype: string | null;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'price_amount', type: 'numeric', precision: 14, scale: 2, nullable: true })
  priceAmount: number | null;

  @Column({ name: 'price_currency', type: 'char', length: 3, default: 'TRY' })
  priceCurrency: string;

  @Column({ name: 'price_is_negotiable', type: 'boolean', default: false })
  priceIsNegotiable: boolean;

  @Column({ name: 'm2_gross', type: 'numeric', precision: 8, scale: 2, nullable: true })
  m2Gross: number | null;

  @Column({ name: 'm2_net', type: 'numeric', precision: 8, scale: 2, nullable: true })
  m2Net: number | null;

  @Column({ name: 'room_count', type: 'smallint', nullable: true })
  roomCount: number | null;

  @Column({ name: 'bathroom_count', type: 'smallint', nullable: true })
  bathroomCount: number | null;

  @Column({ name: 'floor_number', type: 'smallint', nullable: true })
  floorNumber: number | null;

  @Column({ name: 'total_floors', type: 'smallint', nullable: true })
  totalFloors: number | null;

  @Column({ name: 'building_age', type: 'smallint', nullable: true })
  buildingAge: number | null;

  @Column({ name: 'heating_type', type: 'varchar', length: 100, nullable: true })
  heatingType: string | null;

  @Column({ name: 'kitchen_state', type: 'varchar', length: 100, nullable: true })
  kitchenState: string | null;

  @Column({ name: 'car_park', type: 'boolean', nullable: true })
  carPark: boolean | null;

  @Column({ name: 'is_furnished', type: 'boolean', nullable: true })
  isFurnished: boolean | null;

  @Column({ name: 'has_balcony', type: 'boolean', nullable: true })
  hasBalcony: boolean | null;

  @Column({ name: 'has_elevator', type: 'boolean', nullable: true })
  hasElevator: boolean | null;

  @Column({ name: 'in_complex', type: 'boolean', nullable: true })
  inComplex: boolean | null;

  @Column({ name: 'is_loan_eligible', type: 'boolean', nullable: true })
  isLoanEligible: boolean | null;

  @Column({ name: 'is_swap_available', type: 'boolean', nullable: true })
  isSwapAvailable: boolean | null;

  @Column({ name: 'dues_amount', type: 'numeric', precision: 10, scale: 2, nullable: true })
  duesAmount: number | null;

  @Column({ name: 'image_count', type: 'smallint', default: 0 })
  imageCount: number;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'featured_sort_order', type: 'smallint', default: 0 })
  featuredSortOrder: number;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => ListingLocationEntity, (loc) => loc.listing, {
    cascade: true,
    eager: false,
    nullable: true,
  })
  location: ListingLocationEntity | null;

  @OneToMany(() => ListingFeatureEntity, (f) => f.listing, { cascade: true, eager: false })
  features: ListingFeatureEntity[];

  @OneToMany(() => ListingMediaEntity, (m) => m.listing, { cascade: true, eager: false })
  media: ListingMediaEntity[];
}
