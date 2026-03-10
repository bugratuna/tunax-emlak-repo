/**
 * TypeORM DataSource for CLI usage (migration:run, migration:revert, migration:show).
 * Run via:  npm run migration:run  (in apps/api)
 *
 * SSL behaviour mirrors the runtime config — see database/db-ssl.ts.
 * To run migrations against a production DB from CI/CD:
 *   NODE_ENV=production DATABASE_URL=... npm run migration:run
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { resolveSslConfig } from './db-ssl';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
  extra: {
    ssl: resolveSslConfig(),
    connectionTimeoutMillis: 5_000,
  },
});
