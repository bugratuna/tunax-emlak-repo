import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectDto {
  @ApiProperty({
    required: false,
    description: 'Ignored — admin ID is derived from the JWT sub claim',
  })
  @IsString()
  @IsOptional()
  adminId?: string;

  @ApiProperty({ required: false, example: 'Fraudulent price data detected.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
