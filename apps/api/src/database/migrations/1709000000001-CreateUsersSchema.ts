import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersSchema1709000000001 implements MigrationInterface {
  name = 'CreateUsersSchema1709000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── users ─────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE users (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        email         VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20)  NOT NULL DEFAULT 'CONSULTANT',
        name          VARCHAR(255),
        status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_users_email   UNIQUE (email),
        CONSTRAINT chk_users_role   CHECK (role   IN ('ADMIN', 'CONSULTANT')),
        CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED'))
      )
    `);

    // Case-insensitive email lookup index
    await queryRunner.query(
      `CREATE INDEX idx_users_email ON users (lower(email))`,
    );

    // Re-use the trg_set_updated_at() function created by migration 1709000000000
    await queryRunner.query(`
      CREATE TRIGGER users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at()
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS users_updated_at ON users`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
