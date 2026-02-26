import { Module } from '@nestjs/common';
import { AdminModerationModule } from './admin/moderation/moderation.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrmSyncModule } from './crm-sync/crm-sync.module';
import { LeadsModule } from './leads/leads.module';
import { ListingsModule } from './listings/listings.module';
import { MarketingModule } from './marketing/marketing.module';
import { StoreModule } from './store/store.module';

@Module({
  imports: [
    StoreModule,          // @Global — InMemoryStore available everywhere
    CrmSyncModule,        // @Global — CrmSyncService available everywhere
    ListingsModule,
    AdminModerationModule,
    MarketingModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
