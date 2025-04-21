import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfigs } from './configs/database.config';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MikroOrmModule.forRoot(databaseConfigs),
    QueuesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
