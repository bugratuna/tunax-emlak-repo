import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddListingNumber1709000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Atomic sequence — gap-tolerant, race-condition safe
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS listing_number_seq START 1 INCREMENT 1 NO CYCLE`,
    );

    // Nullable: draft/pending listings remain NULL until approval
    await queryRunner.query(
      `ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_number VARCHAR(12)`,
    );

    // Partial unique index — NULLs are excluded so pending listings don't conflict
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_listing_number
       ON listings (listing_number)
       WHERE listing_number IS NOT NULL`,
    );

    // BTREE index for search performance (ILIKE with prefix anchor)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_listings_listing_number_search
       ON listings (listing_number)
       WHERE listing_number IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_listings_listing_number_search`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_listings_listing_number`);
    await queryRunner.query(`ALTER TABLE listings DROP COLUMN IF EXISTS listing_number`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS listing_number_seq`);
  }
}
