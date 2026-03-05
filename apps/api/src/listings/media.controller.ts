import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ListingsService } from './listings.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly listingsService: ListingsService) {}

  // ── PRESIGN ───────────────────────────────────────────────────────────────

  @Post('presign')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CONSULTANT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a presigned S3 PUT URL for direct media upload (CONSULTANT only)',
    description:
      'Step 1 of the 3-step media upload flow:\n' +
      '1. **POST /api/media/presign** — send `{ listingId, fileName, contentType, order? }`. ' +
      '   Responds with `{ uploadUrl, publicUrl, s3Key, expiresIn: 900 }`.\n' +
      '2. **PUT** the image binary directly to `uploadUrl` (set `Content-Type` header to match).\n' +
      '3. **POST /api/listings/:id/media/commit** — send `{ s3Key, publicUrl }` to register ' +
      '   the media row in the database.',
  })
  @ApiOkResponse({
    description: '{ uploadUrl: string; publicUrl: string; s3Key: string; expiresIn: 900 }',
  })
  @ApiNotFoundResponse({ description: 'Listing not found' })
  @ApiBadRequestResponse({ description: 'Invalid fileName or unsupported contentType' })
  @ApiForbiddenResponse({ description: 'Listing belongs to a different consultant' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  presign(@Body() dto: PresignUploadDto, @CurrentUser() user: JwtPayload) {
    return this.listingsService.presignUpload(dto, user.sub);
  }
}
