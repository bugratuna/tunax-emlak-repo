import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an optional `address_details` column to `listing_locations`.
 * Intended for apartment/door numbers, postal codes, and building/site names.
 * Existing rows are unaffected (NULL by default). Fully backward-compatible.
 */
export class AddAddressDetailsToLocation1709000000013 implements MigrationInterface {
  name = 'AddAddressDetailsToLocation1709000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_locations
        ADD COLUMN IF NOT EXISTS address_details TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_locations
        DROP COLUMN IF EXISTS address_details
    `);
  }
}
