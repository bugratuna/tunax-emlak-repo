import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, IsUrl, Min } from 'class-validator';

export class CommitMediaDto {
  @ApiProperty({
    description: 'S3 object key returned by POST /api/media/presign',
    example: 'listings/abc-uuid/def-uuid.jpg',
  })
  @IsString()
  s3Key: string;

  @ApiProperty({
    description: 'Public URL returned by POST /api/media/presign (stored as-is)',
    example: 'https://tunax-repo.s3.eu-north-1.amazonaws.com/listings/abc-uuid/def-uuid.jpg',
  })
  @IsUrl({ require_tld: false })
  publicUrl: string;

  @ApiPropertyOptional({
    default: 0,
    description: 'Display order — lower numbers appear first',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: 1920, description: 'Image width in pixels' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  width?: number;

  @ApiPropertyOptional({ example: 1080, description: 'Image height in pixels' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  height?: number;
}
