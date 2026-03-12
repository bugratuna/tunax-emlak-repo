import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

/** Multer file shape (memory storage — no @types/multer required). */
interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own profile (authenticated)' })
  @ApiOkResponse({ description: 'SafeUser profile of the caller' })
  @ApiUnauthorizedResponse()
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (authenticated)' })
  @ApiOkResponse({ description: 'Updated SafeUser profile' })
  @ApiUnauthorizedResponse()
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('photo', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload own profile photo (authenticated)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ description: 'Updated SafeUser with new profilePhotoUrl' })
  @ApiUnauthorizedResponse()
  async uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: MulterFile,
  ) {
    return this.usersService.uploadProfilePhoto(
      user.sub,
      file.buffer,
      file.mimetype,
    );
  }
}
