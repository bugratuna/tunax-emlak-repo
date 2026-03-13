import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ContactFormDto {
  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ahmet@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: '+90 532 000 00 00' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Konyaaltı bölgesinde 3+1 daire arıyorum.' })
  @IsString()
  @MinLength(10)
  message: string;
}

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  @Post()
  @HttpCode(200)
  // 5 submissions per 10 minutes per IP — spam / lead-gen abuse protection
  @Throttle({ global: { ttl: 600_000, limit: 5 } })
  @ApiOperation({ summary: 'Submit a contact form (public)' })
  @ApiOkResponse({ description: '{ received: true }' })
  submit(@Body() dto: ContactFormDto): { received: true } {
    this.logger.log(
      `[CONTACT] name=${dto.name} email=${dto.email} phone=${dto.phone ?? 'N/A'} message="${dto.message.slice(0, 80)}"`,
    );
    return { received: true };
  }
}
