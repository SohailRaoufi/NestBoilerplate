import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { bullBoardConfigs, queueConfigs } from 'src/configs/queue.config';
import { EmailConsumer } from './consumers/email.consumer';

const isProduction = process.env.NODE_ENV === 'production';

const bullBoardModules = isProduction
  ? []
  : [BullBoardModule.forRoot(bullBoardConfigs)];

@Module({
  imports: [BullModule.forRoot(queueConfigs), ...bullBoardModules],
  providers: [EmailConsumer],
})
export class QueuesModule {}
