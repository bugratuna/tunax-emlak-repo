import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../../users/users.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (ADMIN only)' })
  @ApiOkResponse({ description: 'Array of SafeUser with status field' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  listAll() {
    return this.usersService.listAll();
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a user (ADMIN only) — defaults to PENDING_APPROVAL' })
  @ApiCreatedResponse({ description: 'SafeUser created' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: (dto.role ?? 'CONSULTANT') as Role,
      name: dto.name,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber,
    });
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a user — sets status to ACTIVE (ADMIN only)' })
  @ApiOkResponse({ description: 'SafeUser with status ACTIVE' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend a user — sets status to SUSPENDED (ADMIN only)' })
  @ApiOkResponse({ description: 'SafeUser with status SUSPENDED' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  suspendUser(@Param('id') id: string, @CurrentUser() requester: JwtPayload) {
    return this.usersService.suspendUser(id, requester.sub);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a suspended user — sets status to ACTIVE (ADMIN only)' })
  @ApiOkResponse({ description: 'SafeUser with status ACTIVE' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  activateUser(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }
}
