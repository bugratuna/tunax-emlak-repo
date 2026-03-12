import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds watermarked variant columns to `listing_media`.
 *
 * DESIGN
 * ──────
 * Originals are never modified. The platform generates a branded public-delivery
 * derivative (logo composited bottom-right at 25 % opacity) and stores its S3
 * key and URL here. Public pages consume `watermarked_url`; admin / moderation
 * workflows continue to use the original `s3_key` / `public_url`.
 *
 * Both columns are nullable so existing rows remain valid (NULL → frontend falls
 * back to `public_url`). New uploads attempt watermark generation synchronously;
 * failure leaves the columns NULL (fallback is transparent to the user).
 */
export class AddWatermarkedUrlToMedia1709000000014 implements MigrationInterface {
  name = 'AddWatermarkedUrlToMedia1709000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_media
        ADD COLUMN IF NOT EXISTS watermarked_s3_key VARCHAR(1000),
        ADD COLUMN IF NOT EXISTS watermarked_url    VARCHAR(1000)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listing_media
        DROP COLUMN IF EXISTS watermarked_s3_key,
        DROP COLUMN IF EXISTS watermarked_url
    `);
  }
}
