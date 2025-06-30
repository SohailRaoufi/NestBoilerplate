import 'dotenv/config';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { EmailService } from './email.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
