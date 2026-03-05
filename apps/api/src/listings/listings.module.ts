import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingEntity } from '../database/entities/listing.entity';
import { ListingFeatureEntity } from '../database/entities/listing-feature.entity';
import { ListingLocationEntity } from '../database/entities/listing-location.entity';
import { ListingMediaEntity } from '../database/entities/listing-media.entity';
import { UserEntity } from '../database/entities/user.entity';
import { MediaModule } from '../media/media.module';
import { AutomationQueueProvider } from './automation-queue.provider';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { MediaController } from './media.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingEntity,
      ListingLocationEntity,
      ListingFeatureEntity,
      ListingMediaEntity,
      UserEntity,
    ]),
    MediaModule,
  ],
  controllers: [ListingsController, MediaController],
  providers: [ListingsService, AutomationQueueProvider],
  exports: [ListingsService],
})
export class ListingsModule {}
