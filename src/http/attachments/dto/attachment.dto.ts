import { Attachment } from '@/entities/attachments/attachment.entity';
import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: any;
}


export class AttachmentResponseDto{
    @ApiProperty()
    attachment : Attachment;

    @ApiProperty()
    url : string;
}