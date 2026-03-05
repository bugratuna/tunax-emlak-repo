import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTitle1709000000006 implements MigrationInterface {
  name = 'AddUserTitle1709000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "title" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "title"`);
  }
}
