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
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection URL (e.g. postgresql://tunax:tunax123@localhost:5432/tunax)',
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
  {
    key: 'JWT_ACCESS_SECRET',
    required: true,
    description: 'Secret used to sign JWT access tokens (min 32 chars recommended)',
  },
  {
    key: 'JWT_ACCESS_TOKEN_EXPIRES_IN',
    required: false,
    description: 'JWT access token expiry duration (default: 24h)',
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
    description: 'S3 bucket name for listing media (e.g. tunax-repo)',
  },
  {
    key: 'S3_PUBLIC_BASE_URL',
    required: false,
    description: 'Base URL for public S3 reads; defaults to https://{bucket}.s3.{region}.amazonaws.com',
  },
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
