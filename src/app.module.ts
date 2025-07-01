/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfigs } from './configs/database.config';
import { QueuesModule } from './queues/queues.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailerConfigs } from './configs/mailer.config';
import { CustomerModule } from './http/customer/customer.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { DeviceIdGuard } from './common/guards/device-id.guard';
import { EmailModule } from './services/email-service/email.module';
import { EventsModule } from './events/events.module';
import { AttachmentsModule } from './http/attachments/attachments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MikroOrmModule.forRoot(databaseConfigs),
    MailerModule.forRootAsync({
      useFactory: mailerConfigs,
    }),
    EmailModule,
    EventsModule,
    EventEmitterModule.forRoot(),
    QueuesModule,
    AttachmentsModule,
    CustomerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: DeviceIdGuard,
    },
  ],
})
export class AppModule {}
