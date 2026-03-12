import * as fsSync from 'fs';
import * as path from 'path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import sharp from 'sharp';

// ── Tuning constants ─────────────────────────────────────────────────────────

/**
 * Logo opacity applied to the watermark layer.
 * 0.25 = subtle but clearly visible when the image is saved/printed.
 * Keep ≤ 0.35 to avoid materially damaging listing photo appeal.
 */
const OPACITY = 0.25;

/** Watermark width expressed as a fraction of the host image width. */
const WATERMARK_SCALE = 0.25;

/** Minimum watermark width (prevents logo from being unreadably small). */
const MIN_WM_PX = 100;

/** Maximum watermark width (prevents logo from dominating large images). */
const MAX_WM_PX = 400;

/** Padding from bottom-right edge of the host image, in pixels. */
const EDGE_PADDING = 20;

// ── Path candidates ───────────────────────────────────────────────────────────

/**
 * Ordered list of filesystem paths to try when loading the logo asset.
 * First match wins. All are nullable so filter(Boolean) removes the env-var
 * entry when WATERMARK_ASSET_PATH is not set.
 *
 * Search order:
 *  1. WATERMARK_ASSET_PATH env var — explicit override for any environment.
 *  2. Docker / production  — monorepo mounted at /app, CWD = /app.
 *  3. Development          — NestJS dev server run from apps/api/, CWD = apps/api/.
 *  4. Compiled dist path   — __dirname = dist/media, walk up to repo root.
 */
function assetCandidates(): string[] {
  return [
    process.env.WATERMARK_ASSET_PATH ?? null,
    path.resolve(process.cwd(), 'apps', 'web', 'public', 'brand', 'logo.png'),
    path.resolve(
      process.cwd(),
      '..',
      '..',
      'apps',
      'web',
      'public',
      'brand',
      'logo.png',
    ),
    path.resolve(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'apps',
      'web',
      'public',
      'brand',
      'logo.png',
    ),
  ].filter((p): p is string => typeof p === 'string');
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Generates branded public-delivery variants by compositing the platform logo
 * onto the bottom-right corner of listing images.
 *
 * DESIGN PRINCIPLE
 * ────────────────
 * Originals are NEVER modified. This service produces a *derived* watermarked
 * JPEG stored at a separate S3 key (`_wm.jpg` suffix). The original stays
 * pristine for moderation, duplicate-detection, and admin workflows.
 *
 * FAILURE HANDLING
 * ────────────────
 * If the logo asset is missing or Sharp throws, `applyWatermark` returns the
 * original buffer unchanged and logs a warning. The caller stores
 * `watermarkedUrl = null` and the public frontend silently falls back to the
 * original. This ensures upload flows never block due to watermark failures.
 *
 * POLICY NOTE
 * ───────────
 * The platform's own delivery watermark is platform-owned branding applied to
 * *derived* public variants only. It is explicitly distinct from — and does not
 * conflict with — the prohibition on third-party logos or contact overlays in
 * *original* listing images submitted by consultants.
 */
@Injectable()
export class WatermarkService implements OnModuleInit {
  private readonly logger = new Logger(WatermarkService.name);

  /** Cached logo buffer loaded once at startup. Null = watermarking disabled. */
  private logoBuffer: Buffer | null = null;

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleInit(): Promise<void> {
    for (const candidate of assetCandidates()) {
      try {
        this.logoBuffer = fsSync.readFileSync(candidate);
        this.logger.log(`[WatermarkService] Logo loaded from: ${candidate}`);
        return;
      } catch {
        // try next candidate
      }
    }

    this.logger.warn(
      '[WatermarkService] Logo asset not found in any search path — ' +
        'watermarking is DISABLED for this deployment. ' +
        'Set WATERMARK_ASSET_PATH to the absolute path of logo.png to enable it.',
    );
  }

  /**
   * Returns a JPEG buffer with the platform logo composited onto the
   * bottom-right corner at reduced opacity.
   *
   * Input may be JPEG, PNG, or WebP — output is always JPEG (quality 90)
   * for consistent file-size behaviour regardless of source format.
   *
   * @param imageBuffer  Raw binary of the original image.
   * @returns  Watermarked JPEG buffer, or the *original* buffer if watermarking
   *           is disabled or fails (graceful degradation — never throws).
   */
  async applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
    if (!this.logoBuffer) {
      return imageBuffer;
    }

    try {
      // ── 1. Read host image dimensions ─────────────────────────────────────
      const { width: imgW = 800, height: imgH = 600 } =
        await sharp(imageBuffer).metadata();

      // ── 2. Determine watermark dimensions ─────────────────────────────────
      const targetWidth = Math.max(
        MIN_WM_PX,
        Math.min(MAX_WM_PX, Math.round(imgW * WATERMARK_SCALE)),
      );

      // ── 3. Resize logo and extract raw RGBA pixels ────────────────────────
      const {
        data: rawData,
        info: { width: wmW, height: wmH },
      } = await sharp(this.logoBuffer)
        .resize(targetWidth, undefined, {
          fit: 'inside',
          withoutEnlargement: false,
        })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // ── 4. Scale every alpha byte to achieve target opacity ───────────────
      const pixels = Buffer.from(rawData);
      for (let i = 3; i < pixels.length; i += 4) {
        pixels[i] = Math.round(pixels[i] * OPACITY);
      }

      // ── 5. Re-encode as PNG (preserves modified alpha for compositing) ─────
      const processedLogo = await sharp(pixels, {
        raw: { width: wmW, height: wmH, channels: 4 },
      })
        .png()
        .toBuffer();

      // ── 6. Compute placement: bottom-right with edge padding ──────────────
      const left = Math.max(0, imgW - wmW - EDGE_PADDING);
      const top = Math.max(0, imgH - wmH - EDGE_PADDING);

      // ── 7. Composite and encode as JPEG ───────────────────────────────────
      return await sharp(imageBuffer)
        .composite([{ input: processedLogo, left, top }])
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
    } catch (err) {
      this.logger.warn(
        '[WatermarkService] Watermarking failed — serving original:',
        err,
      );
      return imageBuffer;
    }
  }
}
