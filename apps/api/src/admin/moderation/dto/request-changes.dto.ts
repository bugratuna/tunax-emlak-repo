import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestChangesDto {
  @IsString()
  @IsOptional()
  adminId?: string;

  @IsString()
  @IsNotEmpty()
  feedback: string;
}
