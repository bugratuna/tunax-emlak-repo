/**
 * Fail-fast environment validation.
 * Call validateEnv() once at bootstrap before the NestJS app starts.
 * Required vars are only those the API process actually reads at runtime.
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
    key: 'REDIS_URL',
    required: true,
    description: 'Redis connection URL (e.g. redis://localhost:6379)',
  },
  {
    key: 'INTERNAL_API_KEYS',
    required: true,
    description: 'Comma-separated list of valid internal API keys for worker→API calls',
  },
  // Uncomment when Prisma / JWT are wired up:
  // { key: 'DATABASE_URL', required: true, description: 'PostgreSQL connection URL' },
  // { key: 'JWT_ACCESS_SECRET', required: true, description: 'JWT access token secret' },
  // { key: 'JWT_REFRESH_SECRET', required: true, description: 'JWT refresh token secret' },
];

export function validateEnv(): void {
  const missing: string[] = [];

  for (const rule of RULES) {
    if (rule.required && !process.env[rule.key]) {
      missing.push(`  ${rule.key}  — ${rule.description}`);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n[AREP] Missing required environment variables:\n${missing.join('\n')}\n`,
    );
    process.exit(1);
  }
}
