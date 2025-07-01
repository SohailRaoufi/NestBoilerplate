import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RouterModule } from '@nestjs/core';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [
    AttachmentsModule,
    AuthModule,
    RouterModule.register([
      {
        path: 'customer',
        children: [
          {
            path: 'auth',
            module: AuthModule,
          },
        ],
      },
    ]),
  ],
})
export class CustomerModule {}
