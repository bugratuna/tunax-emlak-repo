import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ListingEntity } from './listing.entity';

@Entity('listing_features')
export class ListingFeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  // Exact key from taxonomy FEATURE_GROUPS (e.g. 'view', 'interiorFeatures')
  @Column({ name: 'feature_group', type: 'varchar', length: 100 })
  featureGroup: string;

  // Exact value from taxonomy options (e.g. 'Deniz Manzarası')
  @Column({ name: 'feature_value', type: 'varchar', length: 200 })
  featureValue: string;

  @ManyToOne(() => ListingEntity, (l) => l.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;
}
