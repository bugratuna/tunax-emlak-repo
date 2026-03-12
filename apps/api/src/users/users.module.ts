import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../database/entities/user.entity';
import { MediaModule } from '../media/media.module';
import { TeamController } from './team.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), MediaModule],
  controllers: [TeamController, UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
