import { Module } from '@nestjs/common';
import { InternalApiKeyGuard } from './guards/internal-api-key.guard';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  controllers: [ModerationController],
  providers: [ModerationService, InternalApiKeyGuard],
})
export class AdminModerationModule {}
