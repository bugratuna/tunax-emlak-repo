import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaColumns1709000000002 implements MigrationInterface {
  name = 'AddMediaColumns1709000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_media
        ADD COLUMN IF NOT EXISTS width      INT,
        ADD COLUMN IF NOT EXISTS height     INT,
        ADD COLUMN IF NOT EXISTS public_url VARCHAR(1000)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE listing_media DROP COLUMN IF EXISTS width`);
    await queryRunner.query(`ALTER TABLE listing_media DROP COLUMN IF EXISTS height`);
    await queryRunner.query(`ALTER TABLE listing_media DROP COLUMN IF EXISTS public_url`);
  }
}
