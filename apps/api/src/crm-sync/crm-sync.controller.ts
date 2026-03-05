import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CrmSyncService } from './crm-sync.service';

@ApiTags('crm-sync')
@Controller('crm-sync')
export class CrmSyncController {
  constructor(private readonly crmSyncService: CrmSyncService) {}

  @Get(':entityId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get CRM sync results for an entity (ADMIN)' })
  @ApiOkResponse({ description: 'Array of CRM sync results (may be empty)' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Requires ADMIN role' })
  getResults(@Param('entityId') entityId: string) {
    return this.crmSyncService.getResults(entityId);
  }
}
