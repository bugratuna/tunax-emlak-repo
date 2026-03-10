/**
 * Resolves the pg/TypeORM SSL configuration from environment variables.
 *
 * Environment variables (all optional):
 *
 *   DB_SSL
 *     "true"  — force SSL on (use in staging that has SSL but NODE_ENV != production)
 *     "false" — force SSL off (use in local Docker where Postgres has no cert)
 *     absent  — auto: on when NODE_ENV=production, off otherwise
 *
 *   DB_SSL_REJECT_UNAUTHORIZED
 *     "true"  — (default) verify the server certificate against trusted CAs
 *     "false" — skip cert verification (use when Postgres has a self-signed cert on a
 *               trusted private network, e.g. plain VPS without a managed DB service)
 *
 * Decision matrix:
 *
 *   NODE_ENV   | DB_SSL   | SSL active | rejectUnauthorized
 *   -----------|----------|------------|--------------------
 *   production | (absent) | YES        | true
 *   production | "true"   | YES        | true (or per DB_SSL_REJECT_UNAUTHORIZED)
 *   production | "false"  | NO         | n/a
 *   development| (absent) | NO         | n/a
 *   development| "true"   | YES        | true (or per DB_SSL_REJECT_UNAUTHORIZED)
 *   any        | "false"  | NO         | n/a
 */
export function resolveSslConfig(): false | { rejectUnauthorized: boolean } {
  const isProd = process.env.NODE_ENV === 'production';
  const sslEnv = process.env.DB_SSL;

  let useSSL: boolean;
  if (sslEnv === 'true') {
    useSSL = true;
  } else if (sslEnv === 'false') {
    useSSL = false;
  } else {
    useSSL = isProd; // default: on in production, off otherwise
  }

  if (!useSSL) return false;

  // Default: reject unauthorized (full cert chain validation).
  // Set DB_SSL_REJECT_UNAUTHORIZED=false only when Postgres uses a self-signed cert
  // on a network you fully control (e.g. private VPS VLAN).
  const rejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

  return { rejectUnauthorized };
}
