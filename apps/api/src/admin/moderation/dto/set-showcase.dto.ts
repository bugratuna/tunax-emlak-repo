import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class SetShowcaseDto {
  @ApiProperty({ example: true, description: "Vitrin'e eklensin mi?" })
  @IsBoolean()
  isShowcase: boolean;

  @ApiProperty({
    required: false,
    example: 0,
    description: 'Sıralama (küçük = önde gösterilir)',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
