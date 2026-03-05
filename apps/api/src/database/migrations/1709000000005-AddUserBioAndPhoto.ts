import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserBioAndPhoto1709000000005 implements MigrationInterface {
  name = 'AddUserBioAndPhoto1709000000005';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS bio               TEXT,
        ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(1000)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS bio`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS profile_photo_url`);
  }
}
