import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

const REQUIRED_ENV = [
  'REDIS_URL',
  'INTERNAL_API_KEY',
  'INTERNAL_API_BASE_URL',
];

function validateWorkerEnv(): void {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `\n[WORKER] Missing required environment variables:\n${missing.join('\n')}\n`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  validateWorkerEnv();
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'warn', 'error'],
  });
  app.enableShutdownHooks();
  console.log('[WORKER] Automation worker started — queue: automation');
}

bootstrap();
