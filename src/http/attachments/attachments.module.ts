import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { S3BucketModule } from '@/services/s3-bucket/s3-bucket.module';

@Module({
  providers: [AttachmentsService],
  controllers: [AttachmentsController],
  imports : [
    S3BucketModule
  ],
  exports : [
    AttachmentsService
  ]
})
export class AttachmentsModule {}
