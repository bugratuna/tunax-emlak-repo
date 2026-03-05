import { Module } from '@nestjs/common';
import { ListingsModule } from '../../listings/listings.module';
import { AdminListingsController } from './admin-listings.controller';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [ListingsModule],
  controllers: [ModerationController, AdminListingsController],
  providers: [ModerationService, InternalApiKeyGuard],
})
export class AdminModerationModule {}
