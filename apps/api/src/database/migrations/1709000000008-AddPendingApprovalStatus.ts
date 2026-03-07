import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingApprovalStatus1709000000008 implements MigrationInterface {
  name = 'AddPendingApprovalStatus1709000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS chk_users_status
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS chk_users_status
    `);
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED'))
    `);
  }
}
