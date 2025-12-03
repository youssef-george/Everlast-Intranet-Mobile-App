import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UploadedFile,
    UseInterceptors,
    Body,
    Query,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { ChatGateway } from '../chat/chat.gateway';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('files')
export class FilesController {
    constructor(
        private filesService: FilesService,
        private chatGateway: ChatGateway,
    ) { }

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
        @Body('messageId') messageId?: string,
        @Body('senderId') senderId?: string,
        @Body('receiverId') receiverId?: string,
        @Body('groupId') groupId?: string,
    ) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            if (!messageId || messageId === 'temp') {
                if (!senderId) {
                    throw new Error('senderId is required when creating a new message');
                }
                if (!receiverId && !groupId) {
                    throw new Error('Either receiverId or groupId must be provided');
                }
            }

            const attachment = await this.filesService.uploadFile(
                file, 
                messageId || 'temp', 
                senderId, 
                receiverId, 
                groupId
            );

            // Emit socket events to notify users about the new message with attachment
            if (attachment && attachment.message) {
                console.log('📤 Emitting socket events for uploaded file message');
                
                // Emit to receiver if it's a direct message
                if (receiverId && senderId) {
                    await this.chatGateway.emitMessageToUsers(
                        attachment.message.id,
                        senderId,
                        receiverId
                    );
                }
                
                // Emit to group if it's a group message
                if (groupId && senderId) {
                    await this.chatGateway.emitMessageToGroup(
                        attachment.message.id,
                        groupId,
                        senderId
                    );
                }
            }

            return attachment;
        } catch (error: any) {
            console.error('File upload error:', error);
            throw error;
        }
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

    @Get('attachment/:id')
    async getAttachment(@Param('id') id: string, @Res() res: Response) {
        const attachment = await this.filesService.getAttachmentById(id);
        if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const filePath = path.join(
            this.filesService.getUploadPath(),
            attachment.url.replace('/uploads/', '')
        );

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        return res.sendFile(path.resolve(filePath));
    }

    @Get('attachments')
    async getAllAttachments(@Query('messageId') messageId?: string) {
        return this.filesService.getAllAttachments(messageId);
    }

    @Get('messages')
    async getAllMessages(@Query('userId') userId?: string, @Query('groupId') groupId?: string) {
        return this.filesService.getAllMessages(userId, groupId);
    }

    @Delete('attachment/:id')
    async deleteAttachment(@Param('id') id: string) {
        return this.filesService.deleteAttachment(id);
    }

    @Post('cleanup-orphaned')
    async cleanupOrphanedFiles() {
        return this.filesService.cleanupOrphanedAttachments();
    }

    @Get('stats')
    async getFileStats() {
        return this.filesService.getFileStats();
    }
}
