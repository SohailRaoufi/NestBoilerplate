import 'dotenv/config';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { databaseConfigs } from 'src/configs/database.config';
import { SeedManager } from '@mikro-orm/seeder/SeedManager';

export default defineConfig({
  extensions: [SeedManager],
  entities: databaseConfigs.entities,
  entitiesTs: databaseConfigs.entities,
  host: databaseConfigs.host,
  port: databaseConfigs.port,
  dbName: databaseConfigs.dbName,
  user: databaseConfigs.user,
  password: databaseConfigs.password,
  driver: PostgreSqlDriver,
  seeder: {
    path: './dist/database/seeders',
    pathTs: './src/database/seeders',
    emit: 'ts',
  },
});
