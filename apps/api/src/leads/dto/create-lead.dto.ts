import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;

  @IsUUID()
  listingId: string;

  @IsEnum(['WHATSAPP', 'CALL', 'FORM'])
  channel: 'WHATSAPP' | 'CALL' | 'FORM';

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164 format' })
  phone: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  preferredTime?: string;

  @IsString()
  @IsOptional()
  utmSource?: string;

  @IsString()
  @IsOptional()
  utmMedium?: string;

  @IsString()
  @IsOptional()
  utmCampaign?: string;

  @IsBoolean()
  consentGiven: boolean;
}
