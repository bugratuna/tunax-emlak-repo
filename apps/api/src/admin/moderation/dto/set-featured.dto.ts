import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class SetFeaturedDto {
  @ApiProperty({ example: true, description: 'Whether this listing should be featured on the homepage' })
  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ required: false, example: 0, description: 'Display order (lower = shown first)' })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
