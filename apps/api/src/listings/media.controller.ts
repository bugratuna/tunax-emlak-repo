import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { S3Service } from '../media/s3.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ListingsService } from './listings.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly s3Service: S3Service,
  ) {}

  // ── PRESIGN ───────────────────────────────────────────────────────────────

  @Post('presign')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get a presigned S3 PUT URL for direct media upload (CONSULTANT only)',
    description:
      'Step 1 of the 3-step media upload flow:\n' +
      '1. **POST /api/media/presign** — send `{ listingId, fileName, contentType, order? }`. ' +
      '   Responds with `{ uploadUrl, publicUrl, s3Key, expiresIn: 900 }`.\n' +
      '2. **PUT** the image binary directly to `uploadUrl` (set `Content-Type` header to match).\n' +
      '3. **POST /api/listings/:id/media/commit** — send `{ s3Key, publicUrl }` to register ' +
      '   the media row in the database.',
  })
  @ApiOkResponse({
    description:
      '{ uploadUrl: string; publicUrl: string; s3Key: string; expiresIn: 900 }',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiBadRequestResponse({
    description: 'Invalid fileName or unsupported contentType',
  })
  @ApiForbiddenResponse({
    description: 'Listing belongs to a different consultant',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  presign(@Body() dto: PresignUploadDto, @CurrentUser() user: JwtPayload) {
    return this.listingsService.presignUpload(dto, user.sub);
  }

  // ── PRIVATE-BUCKET IMAGE PROXY ────────────────────────────────────────────
  //
  // Serves S3 objects through the API using the server's IAM credentials.
  // This is the correct delivery path for private S3 buckets: the browser
  // never needs direct S3 access. The Next.js web app proxies to this
  // endpoint via /api/media/[...key] so image URLs are same-origin in the browser.
  //
  // Why no auth guard here: images are public content equivalent to what a
  // public-read bucket policy would provide. The s3Key is already exposed via
  // the public GET /api/listings endpoints. Guarding this endpoint would break
  // image embeds, shares, and SSR-rendered listing cards.
  //
  // Why @SkipThrottle: this is a static-asset delivery path. Each image load
  // must not consume the global 120-req/min API rate limit.
  //
  // Cache: immutable + 1-year TTL — S3 keys embed a UUID so the same key
  // always serves the same bytes. The browser caches aggressively after the
  // first fetch, eliminating all subsequent proxy hops.

  @Get('*')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Serve S3 media asset via private-bucket proxy (no auth required)',
  })
  async serveMedia(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Extract the S3 key from the request path.
    // req.path = '/api/media/listings/<uuid>/<uuid>.jpg'
    // We find '/media/' and take everything that follows.
    const path = req.path;
    const marker = '/media/';
    const markerIdx = path.indexOf(marker);
    const key = markerIdx >= 0 ? path.slice(markerIdx + marker.length) : '';

    // Security: only serve listing media. Block path traversal and bare keys.
    if (
      !key ||
      !key.startsWith('listings/') ||
      key.includes('..') ||
      key.includes('//')
    ) {
      throw new NotFoundException('Media not found');
    }

    let buffer: Buffer;
    try {
      buffer = await this.s3Service.getObjectAsBuffer(key);
    } catch {
      throw new NotFoundException('Media not found');
    }

    // Derive content-type from the file extension.
    // Watermarked keys end in '.watermarked.jpg' — still jpeg.
    const lower = key.toLowerCase();
    const contentType = lower.endsWith('.png')
      ? 'image/png'
      : lower.endsWith('.webp')
        ? 'image/webp'
        : lower.endsWith('.gif')
          ? 'image/gif'
          : 'image/jpeg'; // .jpg, .jpeg, .watermarked.jpg

    // Immutable: same key → same bytes forever. 1-year TTL aligns with
    // browser/CDN best practice for content-addressable assets.
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return new StreamableFile(buffer);
  }
}
