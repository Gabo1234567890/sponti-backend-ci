import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from 'src/users/users.module';
import { ChallengesModule } from 'src/challenges/challenges.module';

@Module({
  imports: [UsersModule, ChallengesModule],
  controllers: [AdminController],
})
export class AdminModule {}
