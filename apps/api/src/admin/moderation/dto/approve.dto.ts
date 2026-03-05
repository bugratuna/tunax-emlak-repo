import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveDto {
  @ApiProperty({ required: false, description: 'Ignored — admin ID is derived from the JWT sub claim' })
  @IsString()
  @IsOptional()
  adminId?: string;

  @ApiProperty({ required: false, example: 'Listing looks accurate and complete.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
