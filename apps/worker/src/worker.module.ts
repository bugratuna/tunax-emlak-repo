import { Module } from '@nestjs/common';
import { ListingSubmittedProcessor } from './processors/listing-submitted.processor';

@Module({
  providers: [ListingSubmittedProcessor],
})
export class WorkerModule {}
