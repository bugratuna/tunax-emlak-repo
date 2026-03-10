import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'ali@arep.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sifre123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: ['ADMIN', 'CONSULTANT'], default: 'CONSULTANT' })
  @IsIn(['ADMIN', 'CONSULTANT'])
  @IsOptional()
  role?: 'ADMIN' | 'CONSULTANT';

  @ApiProperty({ required: false, example: 'Ali Yılmaz' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, example: 'Ali' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false, example: 'Yılmaz' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false, example: '+90 532 000 00 00' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
