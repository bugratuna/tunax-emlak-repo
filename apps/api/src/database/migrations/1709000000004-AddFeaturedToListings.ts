import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturedToListings1709000000004 implements MigrationInterface {
  name = 'AddFeaturedToListings1709000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listings
        ADD COLUMN IF NOT EXISTS is_featured          BOOLEAN  NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS featured_sort_order  SMALLINT NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_featured
        ON listings (featured_sort_order ASC)
        WHERE is_featured = TRUE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_listings_featured`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS is_featured`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS featured_sort_order`);
  }
}
