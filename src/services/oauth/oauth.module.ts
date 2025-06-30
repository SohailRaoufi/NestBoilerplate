import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';

import { OauthService } from './oauth.service';

@Module({
  imports: [HttpModule, JwtModule.register({})],
  providers: [OauthService],
  exports: [OauthService],
})
export class OauthModule {}
