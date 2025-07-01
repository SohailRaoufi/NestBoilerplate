import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { CustomerEventListener } from './listeners/client/customer-event-listeners.service';
import { EmailModule } from '@/services/email-service/email.module';
import { User } from '@/entities/user/user.entity';

@Module({
  imports: [EmailModule, MikroOrmModule.forFeature([User])],
  providers: [CustomerEventListener],
})
export class EventsModule {}
