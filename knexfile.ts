import 'dotenv/config';
import 'tsconfig-paths/register';
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  default: {
    client: 'pg',
    connection: {
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      stub: 'migration.stub',
      tableName: 'table_migrations',
      directory: './src/database/migrations',
    },
  },
};

module.exports = config;
