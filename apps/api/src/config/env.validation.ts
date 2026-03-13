/**
 * Fail-fast environment validation.
 * Call validateEnv() once at bootstrap before the NestJS app starts.
 * Required vars are only those the API process actually reads at runtime.
 *
 * Production safety rules are enforced when NODE_ENV=production:
 *   - JWT_ACCESS_SECRET must be ≥32 chars and must not contain known dev defaults
 *   - DATABASE_URL must not point to localhost/127.0.0.1 (external hosts only)
 *   - CORS_ORIGINS must be present
 *   - FEATURE_SEED_USERS must not be 'true'
 *   - FEATURE_SWAGGER_ENABLED must not be 'true'
 *   - DB_SSL=false is ALLOWED when the DB host is internal (Docker service name,
 *     loopback, RFC-1918 private IP) — a warning is emitted instead of crashing.
 *     DB_SSL=false on an external host is still a hard error.
 */

interface EnvRule {
  key: string;
  required: boolean;
  description: string;
}

const RULES: EnvRule[] = [
  { key: 'PORT', required: false, description: 'HTTP port (default 3001)' },
  {
    key: 'NODE_ENV',
    required: false,
    description: 'Runtime environment (development|production|test)',
  },
  {
    key: 'CORS_ORIGINS',
    required: false,
    description:
      'Comma-separated list of allowed CORS origins (e.g. https://yourdomain.com)',
  },
  {
    key: 'FEATURE_SWAGGER_ENABLED',
    required: false,
    description:
      'Set to "true" to expose /api/docs. Must be absent or "false" in production.',
  },
  {
    key: 'FEATURE_SEED_USERS',
    required: false,
    description:
      'Set to "true" to seed dev accounts on boot. Must be absent or "false" in production.',
  },
  {
    key: 'DATABASE_URL',
    required: true,
    description:
      'PostgreSQL connection URL (e.g. postgresql://user:pass@host:5432/db)',
  },
  {
    key: 'DB_SSL',
    required: false,
    description:
      '"true" | "false" — force SSL on/off. Default: on when NODE_ENV=production, off otherwise.',
  },
  {
    key: 'DB_SSL_REJECT_UNAUTHORIZED',
    required: false,
    description:
      '"true" | "false" — verify Postgres TLS cert against trusted CAs. Default: true. ' +
      'Set to "false" only when Postgres uses a self-signed cert on a trusted private network.',
  },
  {
    key: 'REDIS_URL',
    required: true,
    description: 'Redis connection URL (e.g. redis://localhost:6379)',
  },
  {
    key: 'INTERNAL_API_KEYS',
    required: true,
    description:
      'Comma-separated list of valid internal API keys for worker→API calls',
  },
  {
    key: 'JWT_ACCESS_SECRET',
    required: true,
    description:
      'Secret used to sign JWT access tokens — must be ≥32 random characters',
  },
  {
    key: 'JWT_ACCESS_TOKEN_EXPIRES_IN',
    required: false,
    description:
      'JWT access token expiry duration (default: 24h; recommend 1h in production)',
  },
  // ── AWS S3 (listing media upload) ──────────────────────────────────────────
  {
    key: 'AWS_ACCESS_KEY_ID',
    required: true,
    description: 'AWS IAM access key for S3 presigned URL generation',
  },
  {
    key: 'AWS_SECRET_ACCESS_KEY',
    required: true,
    description: 'AWS IAM secret key for S3 presigned URL generation',
  },
  {
    key: 'AWS_REGION',
    required: true,
    description: 'AWS region where the S3 bucket lives (e.g. eu-north-1)',
  },
  {
    key: 'AWS_BUCKET_NAME',
    required: true,
    description: 'S3 bucket name for listing media',
  },
  {
    key: 'S3_PUBLIC_BASE_URL',
    required: false,
    description:
      'Base URL for public S3 reads; defaults to https://{bucket}.s3.{region}.amazonaws.com',
  },
];

/**
 * Returns true when the DB host is on a private / internal network where
 * transport-layer encryption is not needed:
 *   - loopback            — localhost, 127.0.0.1
 *   - Docker service name — no dots (e.g. "postgres_gis", "db")
 *   - RFC-1918 ranges     — 10.x, 172.16-31.x, 192.168.x
 */
function isInternalDbHost(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (!hostname.includes('.')) return true; // Docker Compose service name
    if (/^10\./.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return true;
    if (/^192\.168\./.test(hostname)) return true;
    return false;
  } catch {
    return false;
  }
}

/** Known dev-default substrings that must never appear in production secrets */
const DEV_SECRET_SUBSTRINGS = [
  'dev',
  'change-me',
  'secret',
  'example',
  'placeholder',
  'arep-dev',
];

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const errors: string[] = [];

  // ── 1. Required variable presence ─────────────────────────────────────────
  for (const rule of RULES) {
    if (rule.required && !process.env[rule.key]) {
      errors.push(`  MISSING  ${rule.key}  — ${rule.description}`);
    }
  }

  // ── 2. JWT_ACCESS_SECRET quality ──────────────────────────────────────────
  const jwtSecret = process.env.JWT_ACCESS_SECRET ?? '';
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push(
      `  INVALID  JWT_ACCESS_SECRET  — must be at least 32 characters (current: ${jwtSecret.length})`,
    );
  }

  // ── 3. Production-only safety assertions ──────────────────────────────────
  if (isProd) {
    // JWT secret must not contain known dev defaults
    const secretLower = jwtSecret.toLowerCase();
    for (const sub of DEV_SECRET_SUBSTRINGS) {
      if (secretLower.includes(sub)) {
        errors.push(
          `  UNSAFE   JWT_ACCESS_SECRET  — contains dev-default substring "${sub}". Generate a new secret: openssl rand -base64 48`,
        );
        break;
      }
    }

    // DATABASE_URL must not point to localhost in production
    const dbUrl = process.env.DATABASE_URL ?? '';
    if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
      errors.push(
        `  UNSAFE   DATABASE_URL  — points to localhost in production. Use your managed database host.`,
      );
    }

    // DB_SSL=false: safe on internal/private-network hosts (Docker service names,
    // loopback, RFC-1918). Hard error when the DB host is publicly reachable.
    if (process.env.DB_SSL === 'false') {
      const dbUrl = process.env.DATABASE_URL ?? '';
      if (isInternalDbHost(dbUrl)) {
        let hostname = '(unknown)';
        try {
          hostname = new URL(dbUrl).hostname;
        } catch {
          /* ignore */
        }
        console.warn(
          `[Tunax] WARNING: DB_SSL=false in production — ` +
            `host "${hostname}" is an internal/private network address (Docker, VPC). ` +
            `SSL is not required within a trusted private network. ` +
            `Ensure this host is never exposed to the public internet.`,
        );
      } else {
        errors.push(
          `  UNSAFE   DB_SSL=false  — SSL must not be disabled for external database hosts. ` +
            `Set DB_SSL=true. To suppress this for a Docker/VPC host, ensure DATABASE_URL uses ` +
            `an internal hostname (no dots) or a private IP (10.x / 172.16-31.x / 192.168.x).`,
        );
      }
    }

    // CORS_ORIGINS must be explicitly set in production
    if (!process.env.CORS_ORIGINS) {
      errors.push(
        `  MISSING  CORS_ORIGINS  — required in production (e.g. https://yourdomain.com)`,
      );
    }

    // JWT expiry should be short in production — warn if using the 24h default
    const tokenExpiry = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN;
    if (!tokenExpiry || tokenExpiry === '24h') {
      console.warn(
        `[Tunax] WARNING: JWT_ACCESS_TOKEN_EXPIRES_IN is "${tokenExpiry ?? '(unset, defaults to 24h)'}". ` +
          `Recommend setting JWT_ACCESS_TOKEN_EXPIRES_IN=1h in production to limit token lifetime.`,
      );
    }

    // Seed users must be disabled in production
    if (process.env.FEATURE_SEED_USERS === 'true') {
      errors.push(
        `  UNSAFE   FEATURE_SEED_USERS=true  — dev seed accounts must not be created in production`,
      );
    }

    // Swagger must be disabled in production
    if (process.env.FEATURE_SWAGGER_ENABLED === 'true') {
      errors.push(
        `  UNSAFE   FEATURE_SWAGGER_ENABLED=true  — Swagger must not be exposed in production`,
      );
    }
  }

  if (errors.length > 0) {
    console.error(
      `\n[Tunax] Environment validation failed (${errors.length} error${errors.length > 1 ? 's' : ''}):\n\n` +
        errors.join('\n') +
        `\n\nSee apps/api/.env.example for the full variable reference.\n`,
    );
    process.exit(1);
  }
}
