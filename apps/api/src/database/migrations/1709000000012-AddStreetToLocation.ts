import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an optional `street` column to `listing_locations`.
 * Existing rows are unaffected (NULL by default). Fully backward-compatible.
 */
export class AddStreetToLocation1709000000012 implements MigrationInterface {
  name = 'AddStreetToLocation1709000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_locations
        ADD COLUMN IF NOT EXISTS street VARCHAR(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_locations
        DROP COLUMN IF EXISTS street
    `);
  }
}
