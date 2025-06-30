import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { ClientEventListener } from './listeners/client/client-event-listeners.service';
import { EmailModule } from '@/services/email-service/email.module';
import { User } from '@/entities/user/user.entity';

@Module({
  imports: [EmailModule, MikroOrmModule.forFeature([User])],
  providers: [ClientEventListener],
})
export class EventsModule {}
