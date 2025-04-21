import 'dotenv/config';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver, ReflectMetadataProvider } from '@mikro-orm/postgresql';

export const databaseConfigs = {
  entities: ['./dist/src/entities'],
  entitiesTs: ['./src/entities'],
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  dbName: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  driver: PostgreSqlDriver,
  metadataProvider: ReflectMetadataProvider,
  debug: process.env.DATABASE_DEBUG === 'true',
  subscribers: [],
  timezone: '+04:30',
} as MikroOrmModuleOptions;
