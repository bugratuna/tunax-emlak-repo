import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePhotoOrderDto {
  @ApiProperty({
    description:
      'Photo IDs in the desired display order (ascending sort_order)',
    type: [String],
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID(4, { each: true })
  order: string[];
}
