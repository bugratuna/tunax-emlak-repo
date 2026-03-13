import 'dotenv/config';
import helmet from 'helmet';
import { json } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);

  // ── Security headers (helmet) ──────────────────────────────────────────────
  app.use(helmet());

  // ── Explicit body size limit (JSON payloads) ───────────────────────────────
  // Multipart (file uploads) is bounded per-endpoint via FilesInterceptor limits.
  app.use(json({ limit: '512kb' }));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // reject (400) instead of silently strip
      transform: true,
    }),
  );

  // ── CORS — driven by CORS_ORIGINS env var ─────────────────────────────────
  // Local dev default: http://localhost:3000
  // Production: set CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
  const rawOrigins = process.env.CORS_ORIGINS ?? 'http://localhost:3000';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ── Swagger — only when FEATURE_SWAGGER_ENABLED=true ──────────────────────
  // Must never be enabled in production (enforced by validateEnv).
  if (process.env.FEATURE_SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Realty Tunax API')
      .setDescription('Realty Tunax — Backend API (dev/staging only)')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearer',
      )
      .addApiKey(
        { type: 'apiKey', in: 'header', name: 'x-internal-api-key' },
        'internal-key',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    console.log('[Tunax] Swagger UI available at /api/docs (dev only)');
  }

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
