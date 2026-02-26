import { Module } from '@nestjs/common';
import { AutomationQueueProvider } from './automation-queue.provider';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  controllers: [ListingsController],
  providers: [ListingsService, AutomationQueueProvider],
  exports: [ListingsService],
})
export class ListingsModule {}
