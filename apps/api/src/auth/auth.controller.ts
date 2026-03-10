import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
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
  @UseInterceptors(FileInterceptor('profilePhoto'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Public consultant registration — creates user with PENDING_APPROVAL status',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'phoneNumber', 'password'],
      properties: {
        firstName: { type: 'string', example: 'Ali' },
        lastName: { type: 'string', example: 'Yılmaz' },
        email: { type: 'string', format: 'email', example: 'ali@ornek.com' },
        phoneNumber: { type: 'string', example: '05321234567' },
        password: { type: 'string', minLength: 8, example: 'Gizli123!' },
        profilePhoto: {
          type: 'string',
          format: 'binary',
          description: 'jpg/png/webp, maks. 5 MB',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Kullanıcı oluşturuldu — yönetici onayı bekleniyor.',
  })
  @ApiConflictResponse({ description: 'E-posta zaten kayıtlı.' })
  async register(
    @Body() body: Record<string, string>,
    @UploadedFile()
    profilePhoto?: {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    },
  ) {
    const { firstName, lastName, email, phoneNumber, password } = body;
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      throw new BadRequestException(
        'firstName, lastName, email, phoneNumber ve password zorunludur.',
      );
    }
    if (password.length < 8) {
      throw new BadRequestException('Şifre en az 8 karakter olmalıdır.');
    }
    return this.authService.register({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      profilePhoto,
    });
  }
}
