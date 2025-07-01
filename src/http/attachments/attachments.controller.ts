import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '@/common/pipes/file-validation.pipe';
import { AttachmentDto, AttachmentResponseDto } from './dto/attachment.dto';
import { UserJwtGuard } from '@/common/guards/user.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/entities/user/user.entity';

@Controller('attachments')
@UseGuards(UserJwtGuard)
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
        @Body() payload: AttachmentDto,
    ): Promise<AttachmentResponseDto> {
        return await this.attachmentService.upload(file);
    }
}
