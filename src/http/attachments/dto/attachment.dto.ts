import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: any;
}
