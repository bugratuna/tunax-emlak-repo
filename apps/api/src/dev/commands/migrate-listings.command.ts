/**
 * One-time migration: InMemoryStore listings → PostgreSQL.
 *
 * Run ONCE after schema migration while the app is NOT serving traffic:
 *   cd apps/api && npm run migrate:redis
 *
 * The command is safe to re-run — it uses upsert (ON CONFLICT DO UPDATE).
 *
 * NOTE: InMemoryStore data is in-process RAM. This command must boot the same
 * process that holds the data (only useful if data was pre-seeded at startup
 * via a future seed mechanism). For a running production instance with live data,
 * the listing IDs would need to be captured from a Redis snapshot instead.
 * In the current architecture (no Redis persistence for listings), this command
 * primarily migrates dev/seed data.
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { InMemoryStore } from '../../store/store';
import { ListingsService } from '../../listings/listings.service';

async function runMigration() {
  console.log('[migrate-listings] Booting application context...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const store = app.get(InMemoryStore);
  const listingsService = app.get(ListingsService);

  const listings = store.listAllListings();
  console.log(`[migrate-listings] Found ${listings.length} listings in InMemoryStore`);

  if (listings.length === 0) {
    console.log('[migrate-listings] Nothing to migrate. Exiting.');
    await app.close();
    return;
  }

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const listing of listings) {
    try {
      const exists = await listingsService.existsById(listing.id);
      if (exists) {
        console.log(`  [skip] ${listing.id} — already in Postgres`);
        skipped++;
        continue;
      }
      await listingsService.upsertFromStore(listing);
      console.log(`  [ok]   ${listing.id} — "${listing.title}"`);
      migrated++;
    } catch (err: any) {
      const msg = `${listing.id}: ${err?.message ?? String(err)}`;
      console.error(`  [err]  ${msg}`);
      errors.push(msg);
    }
  }

  console.log(
    `\n[migrate-listings] Complete — migrated: ${migrated}, skipped: ${skipped}, errors: ${errors.length}`,
  );
  if (errors.length > 0) {
    console.error('[migrate-listings] Failed rows:');
    errors.forEach((e) => console.error('  ', e));
    process.exitCode = 1;
  }

  await app.close();
}

runMigration().catch((err) => {
  console.error('[migrate-listings] Fatal error:', err);
  process.exit(1);
});
