import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileAndStatus1709000000003 implements MigrationInterface {
  name = 'AddUserProfileAndStatus1709000000003';

  async up(queryRunner: QueryRunner): Promise<void> {
    // status column is already VARCHAR(20); PENDING_APPROVAL = 17 chars — fits
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS first_name    VARCHAR(100),
        ADD COLUMN IF NOT EXISTS last_name     VARCHAR(100),
        ADD COLUMN IF NOT EXISTS phone_number  VARCHAR(30)
    `);
    // Seed users are already ACTIVE — no UPDATE needed
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS first_name`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS last_name`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS phone_number`);
  }
}
