import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ListingEntity } from './listing.entity';

@Entity('listing_media')
export class ListingMediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId: string;

  @Column({ name: 's3_key', type: 'varchar', length: 1000 })
  s3Key: string;

  @Column({ name: 's3_bucket', type: 'varchar', length: 255 })
  s3Bucket: string;

  @Column({ name: 'public_url', type: 'varchar', length: 1000, nullable: true })
  publicUrl: string | null;

  @Column({ name: 'content_type', type: 'varchar', length: 100, nullable: true })
  contentType: string | null;

  @Column({ name: 'size_bytes', type: 'bigint', nullable: true })
  sizeBytes: number | null;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_cover', type: 'boolean', default: false })
  isCover: boolean;

  @Column({ name: 'width', type: 'int', nullable: true })
  width: number | null;

  @Column({ name: 'height', type: 'int', nullable: true })
  height: number | null;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;

  @ManyToOne(() => ListingEntity, (l) => l.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing: ListingEntity;
}
