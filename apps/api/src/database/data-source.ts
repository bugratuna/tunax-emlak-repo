/**
 * TypeORM DataSource for CLI usage (migration:run, migration:revert, migration:show).
 * Run via:  npm run migration:run  (in apps/api)
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
});
