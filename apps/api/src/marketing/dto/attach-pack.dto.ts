import { IsNotEmpty, IsObject } from 'class-validator';
import type { MarketingAssetPack } from '../../store/store';

export class AttachPackDto {
  @IsObject()
  @IsNotEmpty()
  result: MarketingAssetPack;
}
