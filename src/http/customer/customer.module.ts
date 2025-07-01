import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RouterModule } from '@nestjs/core';
import { AttachmentsModule } from '../attachments/attachments.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    AttachmentsModule,
    AuthModule,
    ProfileModule,
    RouterModule.register([
      {
        path: 'customer',
        children: [
          {
            path: 'auth',
            module: AuthModule,
          },
          {
            path: 'profile',
            module: ProfileModule,
          },
        ],
      },
    ]),
  ],
})
export class CustomerModule {}
