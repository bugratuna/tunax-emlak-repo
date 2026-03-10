#!/usr/bin/env node
/**
 * check-dist.js — Local production preflight checker
 *
 * Verifies that all build artifacts exist and required ports are free
 * before starting the production stack.
 *
 * Run automatically via: prestart:all:prod
 * Run manually via: npm run check:dist
 */

'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');

const ROOT = path.resolve(__dirname, '..');

// ─── Artifact checks ──────────────────────────────────────────────────────────

const ARTIFACTS = [
  {
    path: 'apps/api/dist/src/main.js',
    label: 'API build',
    hint: 'npm run build:api',
  },
  {
    path: 'apps/worker/dist/main.js',
    label: 'Worker build',
    hint: 'npm run build:worker',
  },
  {
    path: 'apps/web/.next/BUILD_ID',
    label: 'Web build (.next)',
    hint: 'npm run build:web',
  },
];

let artifactsMissing = false;

console.log('\n[check-dist] Checking build artifacts...');
for (const artifact of ARTIFACTS) {
  const full = path.join(ROOT, artifact.path);
  if (fs.existsSync(full)) {
    console.log(`  ✓  ${artifact.label}  (${artifact.path})`);
  } else {
    console.error(`  ✗  ${artifact.label} MISSING  (${artifact.path})`);
    console.error(`     → Run: ${artifact.hint}`);
    artifactsMissing = true;
  }
}

if (artifactsMissing) {
  console.error('\n[check-dist] Build artifacts missing. Run: npm run build:all\n');
  process.exit(1);
}

// ─── Port checks ─────────────────────────────────────────────────────────────

const WEB_PORT = parseInt(process.env.PORT || '3000', 10);
const API_PORT = parseInt(process.env.API_PORT || '3001', 10);

const PORTS = [
  { port: API_PORT, label: 'API', var: 'API_PORT' },
  { port: WEB_PORT, label: 'Web', var: 'PORT' },
];

/**
 * Returns true if the port is free, false if it is in use.
 * Cross-platform: uses net.createServer instead of shell commands.
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      // EADDRINUSE = already bound; EACCES = no permission (also "not free for us")
      resolve(err.code !== 'EADDRINUSE');
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

async function checkPorts() {
  console.log('\n[check-dist] Checking ports...');
  let portConflict = false;

  for (const { port, label, var: envVar } of PORTS) {
    const free = await isPortFree(port);
    if (free) {
      console.log(`  ✓  Port ${port} (${label}) is free`);
    } else {
      console.error(`  ✗  Port ${port} (${label}) is already in use`);
      console.error(
        `     → Stop the process using port ${port}, or set ${envVar}=<other_port> before running`
      );
      portConflict = true;
    }
  }

  if (portConflict) {
    console.error('\n[check-dist] Port conflict detected. Resolve conflicts before starting.\n');
    console.error('  Tips:');
    console.error('    - Find the process: npx kill-port 3000   (install: npm i -g kill-port)');
    console.error('    - Or: PORT=3002 npm run start:all:prod');
    console.error('    - On Linux/macOS: lsof -i :3000 | grep LISTEN');
    console.error('    - On Windows:     netstat -ano | findstr :3000\n');
    process.exit(1);
  }
}

checkPorts()
  .then(() => {
    console.log('\n[check-dist] All checks passed. Starting production stack...\n');
  })
  .catch((err) => {
    console.error('[check-dist] Unexpected error:', err);
    process.exit(1);
  });
