import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@arep.dev',
    description: 'Registered user email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Password (min 6 characters)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
