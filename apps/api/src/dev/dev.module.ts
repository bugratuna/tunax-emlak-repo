import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';

@Module({
  imports: [UsersModule],
  controllers: [DevController],
  providers: [DevService],
})
export class DevModule {}
