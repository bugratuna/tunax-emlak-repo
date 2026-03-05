import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateDevUserDto {
  @ApiProperty({ example: 'tester@arep.local', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Password1!', description: 'Plain-text password (min 8 chars) — hashed before storage' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN, description: 'User role' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ required: false, example: 'Test Admin', description: 'Display name' })
  @IsString()
  @IsOptional()
  name?: string;
}
