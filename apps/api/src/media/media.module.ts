import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { WatermarkService } from './watermark.service';

@Module({
  providers: [S3Service, WatermarkService],
  exports: [S3Service, WatermarkService],
})
export class MediaModule {}
