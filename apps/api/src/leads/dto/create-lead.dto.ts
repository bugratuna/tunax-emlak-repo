import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty({
    example: 'lead-antalya-2026-001',
    description: 'Client-generated idempotency key (prevents duplicate leads)',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID of the listing this lead is for',
  })
  @IsUUID()
  listingId: string;

  @ApiProperty({ enum: ['WHATSAPP', 'CALL', 'FORM'], example: 'FORM' })
  @IsEnum(['WHATSAPP', 'CALL', 'FORM'])
  channel: 'WHATSAPP' | 'CALL' | 'FORM';

  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Lead full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '+905321234567',
    description: 'E.164 format phone number',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone: string;

  @ApiProperty({
    required: false,
    example: 'İlan hakkında bilgi almak istiyorum.',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    required: false,
    example: 'weekday-mornings',
    description: 'When to contact the lead',
  })
  @IsString()
  @IsOptional()
  preferredTime?: string;

  @ApiProperty({ required: false, example: 'google' })
  @IsString()
  @IsOptional()
  utmSource?: string;

  @ApiProperty({ required: false, example: 'cpc' })
  @IsString()
  @IsOptional()
  utmMedium?: string;

  @ApiProperty({ required: false, example: 'antalya-spring-2026' })
  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @ApiProperty({
    example: true,
    description: 'Must be true — KVKK consent required',
  })
  @Equals(true, { message: 'KVKK consent must be explicitly true' })
  @IsBoolean()
  consentGiven: boolean;
}
