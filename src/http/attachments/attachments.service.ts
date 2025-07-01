import { Attachment } from '@/entities/attachments/attachment.entity';
import { S3BucketPaths } from '@/services/s3-bucket/s3-bucket-paths';
import { S3BucketService } from '@/services/s3-bucket/s3-bucket.service';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AttachmentsService {
    constructor(
        private readonly s3Service : S3BucketService,
        private readonly em : EntityManager
    ){}

    async upload(file : Express.Multer.File){
        const {key} = await this.s3Service.uploadPrivateAttachment(file, S3BucketPaths.ATTACHMENT);

        const url = await this.s3Service.getPrivateAttachmentsUrl(key);
        const newAttachment = this.em.create(Attachment, {
            url: key
        })

        await this.em.persistAndFlush(newAttachment);

        return {
            attachment: newAttachment,
            url
        }
    }
}
