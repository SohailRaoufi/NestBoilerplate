import { LogLevel, NestApplicationOptions } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const logLevels = ['error', 'fatal', 'debug', 'warn', 'verbose','log'] as LogLevel[];

export const appConfigs = {
  logger: process.env.NODE_ENV !== 'production' ? logLevels : false,
} as NestApplicationOptions;

export const corsConfigs = {
  origin: process.env.CORS_ORIGINS,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
} as CorsOptions;
