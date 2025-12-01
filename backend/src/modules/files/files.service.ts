import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
    constructor(private prisma: PrismaService) { }

    private getAttachmentType(mimetype: string): string {
        if (mimetype.startsWith('image/')) return 'IMAGE';
        if (mimetype.startsWith('video/')) return 'VIDEO';
        if (mimetype === 'application/pdf') return 'PDF';
        if (
            mimetype === 'application/msword' ||
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            return 'WORD';
        }
        return 'OTHER';
    }

    async uploadFile(file: Express.Multer.File, messageId: string) {
        const url = `/uploads/${file.filename}`;
        const attachmentType = this.getAttachmentType(file.mimetype);

        const attachment = await this.prisma.attachment.create({
            data: {
                messageId,
                type: attachmentType,
                url,
                filename: file.originalname,
                size: file.size,
            },
            include: {
                message: {
                    include: {
                        sender: true,
                    },
                },
            },
        });

        return attachment;
    }

    async getAttachmentById(id: string) {
        return this.prisma.attachment.findUnique({
            where: { id },
            include: {
                message: {
                    include: {
                        sender: true,
                        receiver: true,
                        group: true,
                    },
                },
            },
        });
    }

    async deleteAttachment(id: string) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
        });

        if (attachment) {
            const filePath = path.join(this.getUploadPath(), attachment.url.replace('/uploads/', ''));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await this.prisma.attachment.delete({
                where: { id },
            });
        }

        return attachment;
    }

    async uploadVoiceNote(file: Express.Multer.File, messageId: string, duration: number) {
        const url = `/uploads/${file.filename}`;

        const voiceNote = await this.prisma.voiceNote.create({
            data: {
                messageId,
                url,
                duration,
            },
        });

        return voiceNote;
    }

    async uploadProfilePicture(file: Express.Multer.File) {
        return `/uploads/${file.filename}`;
    }

    getUploadPath(): string {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        return uploadDir;
    }
}
