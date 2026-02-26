import { Global, Module } from '@nestjs/common';
import { CrmSyncController } from './crm-sync.controller';
import { CrmSyncService } from './crm-sync.service';

@Global()
@Module({
  controllers: [CrmSyncController],
  providers: [CrmSyncService],
  exports: [CrmSyncService],
})
export class CrmSyncModule {}
