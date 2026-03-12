/**
 * Production admin bootstrap — creates a single ADMIN user with status ACTIVE.
 *
 * Does NOT start an HTTP server. Safe to run while the application is live.
 * Uses the exact same bcryptjs(cost=10) hashing path as the normal login flow.
 * Role is hardcoded to ADMIN — the caller cannot override it.
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *
 *   npm run admin:create -- \
 *     --email=admin@yourcompany.com \
 *     --firstName=John \
 *     --lastName=Doe \
 *     --phoneNumber='+905551112233'
 *
 *   Password is read from the ADMIN_PASSWORD environment variable to avoid
 *   it appearing in `ps aux`, shell history, or OS audit logs.
 *   Set it inline or export it before running:
 *
 *     ADMIN_PASSWORD='Str0ng!Pass' npm run admin:create -- --email=...
 *
 * ── Docker exec (recommended for EC2 production) ───────────────────────────
 *
 *   docker compose exec \
 *     -e ADMIN_PASSWORD='Str0ng!Pass' \
 *     main_app \
 *     sh -c "cd apps/api && npm run admin:create -- \
 *       --email=admin@yourcompany.com \
 *       --firstName=John \
 *       --lastName=Doe \
 *       --phoneNumber='+905551112233'"
 *
 * ── Security properties ────────────────────────────────────────────────────
 *
 *   • Password ONLY via env var — never a CLI arg, never logged
 *   • Rejects .local email domains (reserved for dev seed accounts)
 *   • Minimum 10-character password enforced
 *   • Idempotent: exits with code 1 if email already exists, no partial write
 *   • No HTTP server started — no public endpoint exposed
 */
import 'dotenv/config';
import { parseArgs } from 'util';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { UsersService } from '../../users/users.service';
import { Role } from '../../common/enums/role.enum';

// ── Argument parsing ─────────────────────────────────────────────────────────

function parseCliArgs(): {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | undefined;
} {
  let parsed: ReturnType<typeof parseArgs>;

  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        phoneNumber: { type: 'string' },
      },
      strict: true, // reject unknown flags
    });
  } catch (err: unknown) {
    console.error(
      '[admin:create] ERROR: Invalid arguments.\n' +
        (err instanceof Error ? `  ${err.message}\n` : '') +
        '\n  Usage:\n' +
        '    npm run admin:create -- \\\n' +
        '      --email=admin@company.com \\\n' +
        '      --firstName=John \\\n' +
        '      --lastName=Doe \\\n' +
        '      --phoneNumber=+905551112233\n' +
        '\n  Password: set ADMIN_PASSWORD env var',
    );
    process.exit(1);
  }

  const { email, firstName, lastName, phoneNumber } = parsed.values;

  const missing: string[] = [];
  if (!email) missing.push('--email');
  if (!firstName) missing.push('--firstName');
  if (!lastName) missing.push('--lastName');

  if (missing.length > 0) {
    console.error(
      `[admin:create] ERROR: Missing required argument(s): ${missing.join(', ')}\n` +
        '\n  Usage:\n' +
        '    npm run admin:create -- \\\n' +
        '      --email=admin@company.com \\\n' +
        '      --firstName=John \\\n' +
        '      --lastName=Doe \\\n' +
        '      --phoneNumber=+905551112233',
    );
    process.exit(1);
  }

  return {
    email: email as string,
    firstName: firstName as string,
    lastName: lastName as string,
    phoneNumber: phoneNumber as string | undefined,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function createAdmin(): Promise<void> {
  const { email: rawEmail, firstName, lastName, phoneNumber } = parseCliArgs();

  // Normalise email to lowercase
  const email = rawEmail.trim().toLowerCase();

  // Password comes exclusively from the environment — never a CLI arg
  const password = process.env.ADMIN_PASSWORD;

  // ── Input validation ───────────────────────────────────────────────────────

  if (!password) {
    console.error(
      '[admin:create] ERROR: ADMIN_PASSWORD environment variable is required.\n' +
        '  Set it inline to avoid shell history exposure:\n' +
        "    ADMIN_PASSWORD='Str0ng!Pass' npm run admin:create -- --email=...",
    );
    process.exit(1);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(
      `[admin:create] ERROR: "${email}" is not a valid email address.`,
    );
    process.exit(1);
  }

  if (email.endsWith('.local')) {
    console.error(
      '[admin:create] ERROR: .local domains are reserved for development seed accounts. ' +
        'Use a real email address.',
    );
    process.exit(1);
  }

  if (password.length < 10) {
    console.error(
      '[admin:create] ERROR: ADMIN_PASSWORD must be at least 10 characters.',
    );
    process.exit(1);
  }

  // ── Boot NestJS application context (no HTTP server) ──────────────────────

  console.log('[admin:create] Booting application context...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const usersService = app.get(UsersService);

  try {
    // ── Idempotency guard ──────────────────────────────────────────────────
    const existing = await usersService.findByEmail(email);
    if (existing) {
      console.error(
        `[admin:create] ERROR: A user with email "${email}" already exists.\n` +
          `  ID:     ${existing.id}\n` +
          `  Role:   ${existing.role}\n` +
          `  Status: ${existing.status}\n` +
          '  No changes were made.',
      );
      process.exitCode = 1;
      return;
    }

    // ── Create the admin user ──────────────────────────────────────────────
    // status: 'ACTIVE'   — bypass the PENDING_APPROVAL default for self-registrations
    // role:   Role.ADMIN — hardcoded; not user-controlled
    const user = await usersService.createUser({
      email,
      password,
      role: Role.ADMIN,
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phoneNumber,
      status: 'ACTIVE',
    });

    console.log('[admin:create] Admin user created successfully:');
    console.log(`  ID:          ${user.id}`);
    console.log(`  Email:       ${user.email}`);
    console.log(`  Name:        ${user.firstName} ${user.lastName}`);
    console.log(`  Phone:       ${user.phoneNumber ?? '(not set)'}`);
    console.log(`  Role:        ${user.role}`);
    console.log(`  Status:      ${user.status}`);
    console.log('');
    console.log('  Login:  POST /api/auth/login  { email, password }');
    console.log('  ACTION: Store credentials in your password manager now.');
  } finally {
    await app.close();
  }
}

createAdmin().catch((err: unknown) => {
  console.error(
    '[admin:create] Fatal error:',
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
