import { Module } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module';
import { PublicController } from './public.controller';

@Module({
  imports: [ListingsModule],
  controllers: [PublicController],
})
export class PublicModule {}
