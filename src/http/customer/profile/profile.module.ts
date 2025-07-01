import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { User } from '@/entities/user/user.entity';

import { UserJwtStrategy } from '@/common/strategies/user-jwt.strategy';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  providers: [ProfileService, UserJwtStrategy],
  controllers: [ProfileController],
})
export class ProfileModule {}
