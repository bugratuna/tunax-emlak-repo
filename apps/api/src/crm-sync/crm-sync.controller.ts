import { Controller, Get, Param } from '@nestjs/common';
import { CrmSyncService } from './crm-sync.service';

@Controller('crm-sync')
export class CrmSyncController {
  constructor(private readonly crmSyncService: CrmSyncService) {}

  @Get(':entityId')
  getResults(@Param('entityId') entityId: string) {
    return this.crmSyncService.getResults(entityId);
  }
}
