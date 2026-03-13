import {
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  // 5 attempts per 15-minute window per IP — brute-force protection
  @Throttle({ global: { ttl: 900_000, limit: 5 } })
  @ApiOperation({ summary: 'Login — returns a JWT access token' })
  @ApiOkResponse({
    description: 'Login successful',
    schema: {
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['accessToken'],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('register')
  @HttpCode(201)
  // 3 registrations per hour per IP — account-creation spam protection
  @Throttle({ global: { ttl: 3_600_000, limit: 3 } })
  @UseInterceptors(FileInterceptor('profilePhoto'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Public consultant registration — creates user with PENDING_APPROVAL status',
  })
  @ApiCreatedResponse({
    description: 'Kullanıcı oluşturuldu — yönetici onayı bekleniyor.',
  })
  @ApiConflictResponse({ description: 'E-posta zaten kayıtlı.' })
  async register(
    @Body() dto: RegisterDto,
    @UploadedFile()
    profilePhoto?: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    return this.authService.register({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: dto.password,
      profilePhoto,
    });
  }
}
