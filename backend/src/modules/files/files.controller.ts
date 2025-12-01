import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('files')
export class FilesController {
    constructor(private filesService: FilesService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = new FilesService(null).getUploadPath();
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
        }),
    )
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body('messageId') messageId: string,
    ) {
        return this.filesService.uploadFile(file, messageId);
    }

    @Post('voice')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = new FilesService(null).getUploadPath();
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `voice-${uniqueSuffix}.webm`);
                },
            }),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
        }),
    )
    async uploadVoiceNote(
        @UploadedFile() file: Express.Multer.File,
        @Body('messageId') messageId: string,
        @Body('duration') duration: string,
    ) {
        return this.filesService.uploadVoiceNote(file, messageId, parseInt(duration));
    }

    @Post('profile')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const uploadPath = new FilesService(null).getUploadPath();
                    cb(null, uploadPath);
                },
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadProfilePicture(@UploadedFile() file: Express.Multer.File) {
        return this.filesService.uploadProfilePicture(file);
    }
}
