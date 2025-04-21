import 'dotenv/config';
import { ExpressAdapter } from '@bull-board/express';
import { BullRootModuleOptions } from '@nestjs/bullmq';
import { BullBoardModuleOptions } from '@bull-board/nestjs';

export const queueConfigs = {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
} as BullRootModuleOptions;

export const bullBoardConfigs = {
  route: '/queues',
  adapter: ExpressAdapter,
} as BullBoardModuleOptions;
