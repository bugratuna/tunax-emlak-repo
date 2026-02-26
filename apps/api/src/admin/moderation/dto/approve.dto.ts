import { IsOptional, IsString } from 'class-validator';

export class ApproveDto {
  @IsString()
  @IsOptional()
  adminId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
