import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoldStatus1709000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_sold BOOLEAN NOT NULL DEFAULT FALSE`,
    );
    await queryRunner.query(
      `ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ NULL`,
    );
    // Index for stats queries (COUNT WHERE is_sold = true / false)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_listings_is_sold ON listings (is_sold)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_listings_is_sold`);
    await queryRunner.query(
      `ALTER TABLE listings DROP COLUMN IF EXISTS sold_at`,
    );
    await queryRunner.query(
      `ALTER TABLE listings DROP COLUMN IF EXISTS is_sold`,
    );
  }
}
