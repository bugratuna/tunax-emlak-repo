import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnpublishedStatus1709000000009 implements MigrationInterface {
  name = 'AddUnpublishedStatus1709000000009';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old constraint (only allowed DRAFT,PENDING_REVIEW,NEEDS_CHANGES,PUBLISHED,ARCHIVED)
    await queryRunner.query(`
      ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_status
    `);
    // Recreate with UNPUBLISHED added
    await queryRunner.query(`
      ALTER TABLE listings
        ADD CONSTRAINT chk_status
        CHECK (status IN ('DRAFT','PENDING_REVIEW','NEEDS_CHANGES','PUBLISHED','ARCHIVED','UNPUBLISHED'))
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE listings DROP CONSTRAINT IF EXISTS chk_status
    `);
    await queryRunner.query(`
      ALTER TABLE listings
        ADD CONSTRAINT chk_status
        CHECK (status IN ('DRAFT','PENDING_REVIEW','NEEDS_CHANGES','PUBLISHED','ARCHIVED'))
    `);
  }
}
