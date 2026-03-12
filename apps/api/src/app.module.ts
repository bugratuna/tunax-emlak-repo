import { Module } from '@nestjs/common';
import { AdminModerationModule } from './admin/moderation/moderation.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { CrmSyncModule } from './crm-sync/crm-sync.module';
import { DatabaseModule } from './database/database.module';
import { DevModule } from './dev/dev.module';
import { LeadsModule } from './leads/leads.module';
import { ListingsModule } from './listings/listings.module';
import { MarketingModule } from './marketing/marketing.module';
import { PublicModule } from './public/public.module';
import { StoreModule } from './store/store.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DatabaseModule, // TypeORM — PostgreSQL + PostGIS (must be first)
    StoreModule, // @Global — InMemoryStore (moderation/scoring/leads/marketing)
    CrmSyncModule, // @Global — CrmSyncService available everywhere
    UsersModule,
    AuthModule,
    ListingsModule,
    AdminModerationModule,
    AdminUsersModule,
    MarketingModule,
    LeadsModule,
    ContactModule,
    PublicModule,
    // DEV ONLY — routes literally absent in production
    ...(process.env.NODE_ENV === 'development' ? [DevModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
