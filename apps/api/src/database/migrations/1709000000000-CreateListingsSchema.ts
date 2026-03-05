import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateListingsSchema1709000000000 implements MigrationInterface {
  name = 'CreateListingsSchema1709000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // ── PostGIS ───────────────────────────────────────────────────────────────
    // The postgis/postgis Docker image pre-enables PostGIS on the database,
    // but CREATE EXTENSION IF NOT EXISTS is idempotent and safe to run anyway.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ── listings ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE listings (
        id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title             VARCHAR(500) NOT NULL,
        consultant_id     UUID        NOT NULL,
        status            VARCHAR(30)  NOT NULL DEFAULT 'PENDING_REVIEW',
        category          VARCHAR(20),
        property_type     VARCHAR(100),
        listing_type      VARCHAR(100),
        subtype           VARCHAR(100),
        description       TEXT,
        price_amount      NUMERIC(14,2),
        price_currency    CHAR(3)      NOT NULL DEFAULT 'TRY',
        price_is_negotiable BOOLEAN   NOT NULL DEFAULT FALSE,
        m2_gross          NUMERIC(8,2),
        m2_net            NUMERIC(8,2),
        room_count        SMALLINT,
        bathroom_count    SMALLINT,
        floor_number      SMALLINT,
        total_floors      SMALLINT,
        building_age      SMALLINT,
        heating_type      VARCHAR(100),
        kitchen_state     VARCHAR(100),
        car_park          BOOLEAN,
        is_furnished      BOOLEAN,
        has_balcony       BOOLEAN,
        has_elevator      BOOLEAN,
        in_complex        BOOLEAN,
        is_loan_eligible  BOOLEAN,
        is_swap_available BOOLEAN,
        dues_amount       NUMERIC(10,2),
        image_count       SMALLINT    NOT NULL DEFAULT 0,
        submitted_at      TIMESTAMPTZ,
        published_at      TIMESTAMPTZ,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_status CHECK (
          status IN ('DRAFT','PENDING_REVIEW','NEEDS_CHANGES','PUBLISHED','ARCHIVED')
        ),
        CONSTRAINT chk_category CHECK (category IS NULL OR category IN ('SALE','RENT'))
      )
    `);

    // ── listing_locations (PostGIS) ──────────────────────────────────────────
    // geom is a GENERATED ALWAYS AS STORED column — auto-updated by Postgres
    // whenever lat/lng change. ST_MakePoint is IMMUTABLE, so this is valid.
    await queryRunner.query(`
      CREATE TABLE listing_locations (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id    UUID          NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
        city          VARCHAR(100),
        district      VARCHAR(100),
        neighborhood  VARCHAR(100),
        lat           DOUBLE PRECISION,
        lng           DOUBLE PRECISION,
        geom          GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                        CASE
                          WHEN lat IS NOT NULL AND lng IS NOT NULL
                          THEN ST_SetSRID(ST_MakePoint(lng, lat), 4326)
                        END
                      ) STORED,
        CONSTRAINT chk_lat CHECK (lat IS NULL OR (lat >= -90  AND lat <= 90)),
        CONSTRAINT chk_lng CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180))
      )
    `);

    // ── listing_media ─────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE listing_media (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id    UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        s3_key        VARCHAR(1000) NOT NULL,
        s3_bucket     VARCHAR(255)  NOT NULL,
        content_type  VARCHAR(100),
        size_bytes    BIGINT,
        sort_order    SMALLINT      NOT NULL DEFAULT 0,
        is_cover      BOOLEAN       NOT NULL DEFAULT FALSE,
        uploaded_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // ── listing_features ─────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE listing_features (
        id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
        listing_id    UUID          NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        feature_group VARCHAR(100)  NOT NULL,
        feature_value VARCHAR(200)  NOT NULL,
        CONSTRAINT uq_listing_feature UNIQUE (listing_id, feature_group, feature_value)
      )
    `);

    // ── typeorm_migrations tracking table created automatically by TypeORM ───

    // ── Indexes: listings (scalar) ────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX idx_listings_status         ON listings (status)`);
    await queryRunner.query(`CREATE INDEX idx_listings_category       ON listings (category)`);
    await queryRunner.query(`CREATE INDEX idx_listings_property_type  ON listings (property_type)`);
    await queryRunner.query(`CREATE INDEX idx_listings_subtype        ON listings (subtype)`);
    await queryRunner.query(`CREATE INDEX idx_listings_price_amount   ON listings (price_amount)`);
    await queryRunner.query(`CREATE INDEX idx_listings_room_count     ON listings (room_count)`);
    await queryRunner.query(`CREATE INDEX idx_listings_m2_gross       ON listings (m2_gross)`);
    await queryRunner.query(`CREATE INDEX idx_listings_consultant_id  ON listings (consultant_id)`);
    await queryRunner.query(`CREATE INDEX idx_listings_status_cat     ON listings (status, category)`);
    await queryRunner.query(`CREATE INDEX idx_listings_created_at     ON listings (created_at DESC)`);

    // ── Indexes: listing_locations ───────────────────────────────────────────
    // GIST index — backs && (bbox overlap) and ST_DWithin queries
    await queryRunner.query(`
      CREATE INDEX idx_listing_location_geom     ON listing_locations USING GIST (geom)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_listing_location_district ON listing_locations (lower(district))
    `);
    await queryRunner.query(`
      CREATE INDEX idx_listing_location_city     ON listing_locations (lower(city))
    `);

    // ── Indexes: listing_features ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX idx_listing_features_lid        ON listing_features (listing_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_listing_features_grp_val    ON listing_features (feature_group, feature_value)
    `);

    // ── updated_at auto-maintenance trigger ──────────────────────────────────
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION trg_set_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$
    `);
    await queryRunner.query(`
      CREATE TRIGGER listings_updated_at
        BEFORE UPDATE ON listings
        FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at()
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS listings_updated_at ON listings`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS trg_set_updated_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_features`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_media`);
    await queryRunner.query(`DROP TABLE IF EXISTS listing_locations`);
    await queryRunner.query(`DROP TABLE IF EXISTS listings`);
  }
}
