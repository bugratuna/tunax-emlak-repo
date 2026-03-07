import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ali', description: 'Ad' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Yılmaz', description: 'Soyad' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'ali@ornek.com', description: 'E-posta adresi' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '05321234567', description: 'Telefon numarası' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'Gizli123!', description: 'Şifre (en az 8 karakter)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    required: false,
    type: 'string',
    format: 'binary',
    description: 'Profil fotoğrafı (jpg / png / webp, maks. 5 MB)',
  })
  @IsOptional()
  profilePhoto?: unknown;
}
