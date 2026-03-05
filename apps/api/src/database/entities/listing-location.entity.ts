import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ListingEntity } from './listing.entity';

// NOTE: the `geom` column (geometry(Point, 4326)) is NOT mapped here.
// It is a PostgreSQL GENERATED ALWAYS AS STORED column defined in the migration.
// It is referenced via raw SQL in bbox queries using the join alias.
@Entity('listing_locations')
export class ListingLocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ name: 'district', type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ name: 'neighborhood', type: 'varchar', length: 100, nullable: true })
  neighborhood: string | null;

  @Column({ name: 'lat', type: 'double precision', nullable: true })
  lat: number | null;

  @Column({ name: 'lng', type: 'double precision', nullable: true })
  lng: number | null;

  @OneToOne(() => ListingEntity, (l) => l.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;
}
