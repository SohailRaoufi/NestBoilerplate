import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@/common/pipes/file-validation.pipe';
import { AttachmentDto } from './dto/attachment.dto';
import { UserJwtGuard } from '@/common/guards/user.guard';
import { retry } from 'rxjs';
import { Attachment } from '@/entities/attachments/attachment.entity';

@Controller('attachments')
// @UseGuards(UserJwtGuard)
@ApiBearerAuth()
@ApiTags("Attachments")
export class AttachmentsController {
    constructor(private readonly attachmentService: AttachmentsService){}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'File Upload' })
    @ApiConsumes("multipart/form-data")
    @UseInterceptors(FileInterceptor("file"))
    async upload(
        @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
        @Body() payload: AttachmentDto
    ): Promise<{attachment:Attachment, url: string}> {
        return await this.attachmentService.upload(file);
    }
}
