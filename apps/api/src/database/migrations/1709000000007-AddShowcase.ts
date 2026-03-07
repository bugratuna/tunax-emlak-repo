import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShowcase1709000000007 implements MigrationInterface {
  name = 'AddShowcase1709000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "is_showcase" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "showcase_order" smallint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "showcase_order"`);
    await queryRunner.query(`ALTER TABLE "listings" DROP COLUMN IF EXISTS "is_showcase"`);
  }
}
