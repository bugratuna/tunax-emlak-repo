import {
  Injectable,
  Logger,
  Module,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectDataSource, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { resolveSslConfig } from './db-ssl';
import { ListingEntity } from './entities/listing.entity';
import { ListingFeatureEntity } from './entities/listing-feature.entity';
import { ListingLocationEntity } from './entities/listing-location.entity';
import { ListingMediaEntity } from './entities/listing-media.entity';
import { UserEntity } from './entities/user.entity';

/**
 * Logs the resolved DB connection target on startup and warns if migrations are missing.
 * Emits the exact line:
 *   [AREP] DB CONNECT => host:port/db schema=public user=xxx
 */
@Injectable()
class DatabaseHealthService implements OnApplicationBootstrap {
  private readonly logger = new Logger('DatabaseHealth');

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    // ── 1. Print canonical connection line ────────────────────────────────────
    const rawUrl = process.env.DATABASE_URL ?? '';
    try {
      const parsed = new URL(rawUrl);
      const port = parsed.port || '5432';
      const db = parsed.pathname.slice(1);
      this.logger.log(
        `[AREP] DB CONNECT => ${parsed.hostname}:${port}/${db} schema=public user=${parsed.username}`,
      );
    } catch {
      this.logger.warn('[AREP] DATABASE_URL is not set or not a valid URL');
    }

    // ── 2. Dev-only migration readiness check ─────────────────────────────────
    if (process.env.NODE_ENV !== 'development') return;

    try {
      const rows = await this.ds.query<Array<{ table_name: string }>>(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('listings', 'listing_locations', 'users')
        ORDER BY table_name
      `);
      const found = new Set(
        rows.map((r: { table_name: string }) => r.table_name),
      );
      const required = ['listings', 'listing_locations', 'users'];
      const missing = required.filter((t) => !found.has(t));

      if (missing.length > 0) {
        this.logger.warn(
          `[AREP] DB not fully migrated — missing: ${missing.join(', ')}. ` +
            `Run: cd apps/api && npm run migration:run`,
        );
      } else {
        this.logger.log(
          '[AREP] DB tables OK ✓ (listings, listing_locations, users present)',
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[AREP] DB readiness check failed: ${msg}`);
    }
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        url: process.env.DATABASE_URL,
        entities: [
          UserEntity,
          ListingEntity,
          ListingLocationEntity,
          ListingMediaEntity,
          ListingFeatureEntity,
        ],
        migrationsRun: false,
        synchronize: false,
        logging:
          process.env.NODE_ENV === 'development'
            ? (['query', 'error'] as const)
            : (['error'] as const),
        extra: {
          max: 10,
          idleTimeoutMillis: 30_000,
          // SSL resolved from DB_SSL / DB_SSL_REJECT_UNAUTHORIZED env vars.
          // Defaults: on in production, off in dev. See database/db-ssl.ts.
          ssl: resolveSslConfig(),
          // Abort queries that run longer than 30 seconds (prevents pool exhaustion)
          statement_timeout: 30_000,
          // Fail fast if the DB host is unreachable on boot
          connectionTimeoutMillis: 5_000,
        },
      }),
    }),
  ],
  providers: [DatabaseHealthService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
