import { IsOptional, IsString } from 'class-validator';

export class RejectDto {
  @IsString()
  @IsOptional()
  adminId?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
