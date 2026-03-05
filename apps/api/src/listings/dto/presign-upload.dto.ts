import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, IsUUID, Matches, Min } from 'class-validator';

export const ALLOWED_UPLOAD_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export class PresignUploadDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID of the listing this media belongs to',
  })
  @IsUUID()
  listingId: string;

  @ApiProperty({
    example: 'front-view.jpg',
    description: 'Original file name — used only to derive the extension',
  })
  @IsString()
  @Matches(/^[\w\-. ]+$/, {
    message: 'fileName may only contain letters, digits, dash, underscore, dot, or space',
  })
  fileName: string;

  @ApiProperty({
    example: 'image/jpeg',
    enum: ALLOWED_UPLOAD_CONTENT_TYPES,
    description: 'MIME type of the image',
  })
  @IsIn(ALLOWED_UPLOAD_CONTENT_TYPES, {
    message: `contentType must be one of: ${ALLOWED_UPLOAD_CONTENT_TYPES.join(', ')}`,
  })
  contentType: string;

  @ApiPropertyOptional({
    default: 0,
    description: 'Display order — stored in listing_media after commit',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order: number = 0;
}
