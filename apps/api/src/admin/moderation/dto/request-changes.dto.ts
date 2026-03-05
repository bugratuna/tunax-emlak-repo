import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestChangesDto {
  @ApiProperty({ required: false, description: 'Ignored — admin ID is derived from the JWT sub claim' })
  @IsString()
  @IsOptional()
  adminId?: string;

  @ApiProperty({ example: 'Please add accurate square footage and update the price.' })
  @IsString()
  @IsNotEmpty()
  feedback: string;
}
