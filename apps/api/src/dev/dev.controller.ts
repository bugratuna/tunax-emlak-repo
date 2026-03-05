import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../admin/moderation/guards/internal-api-key.guard';
import { CreateDevUserDto } from './dto/create-dev-user.dto';
import { DevService } from './dev.service';

@ApiTags('dev')
@ApiSecurity('internal-key')
@UseGuards(InternalApiKeyGuard)
@Controller('dev')
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Post('users')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a dev user (DEV only — requires x-internal-api-key)' })
  @ApiCreatedResponse({ description: 'User created — passwordHash excluded from response' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-internal-api-key' })
  @ApiConflictResponse({ description: 'Email already exists' })
  createUser(@Body() dto: CreateDevUserDto) {
    return this.devService.createUser(dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all dev users (DEV only — requires x-internal-api-key)' })
  @ApiOkResponse({ description: 'Array of safe user objects — passwordHash excluded' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-internal-api-key' })
  listUsers() {
    return this.devService.listUsers();
  }

  @Post('reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reset user store to defaults (DEV only — requires x-internal-api-key)' })
  @ApiOkResponse({ description: 'Store reset; returns the two default seed users' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid x-internal-api-key' })
  reset() {
    return this.devService.reset();
  }
}
