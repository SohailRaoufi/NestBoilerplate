import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { User } from '@/entities/user/user.entity';
import { UserOtp } from '@/entities/user/user-otp.entity';
import { OauthModule } from '@/services/oauth/oauth.module';
import { UserDevice } from '@/entities/user/user-device.entity';
import { S3BucketModule } from '@/services/s3-bucket/s3-bucket.module';
import { UserForgetPassword } from '@/entities/user/user-forget-password.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserJwtStrategy } from '@/common/strategies/user-jwt.strategy';
import { jwtUserOptions } from '@/configs/auth.config';

@Module({
  providers: [AuthService, UserJwtStrategy],
  controllers: [AuthController],
  imports: [
    MikroOrmModule.forFeature([User, UserOtp, UserForgetPassword, UserDevice]),
    JwtModule.register(jwtUserOptions),
    S3BucketModule,
    OauthModule,
  ],
})
export class AuthModule {}
