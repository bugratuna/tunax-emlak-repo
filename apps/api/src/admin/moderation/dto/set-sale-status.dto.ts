import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';

export class SetSaleStatusDto {
  @ApiProperty({ description: 'Mark listing as sold (true) or unsold (false)' })
  @IsBoolean()
  isSold: boolean;

  @ApiPropertyOptional({
    description: 'Sale date (ISO 8601). Defaults to now when isSold=true.',
  })
  @IsOptional()
  @IsISO8601()
  soldAt?: string;
}
