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

    async uploadFile(file: Express.Multer.File, messageId: string, senderId?: string, receiverId?: string, groupId?: string) {
        const url = `/uploads/${file.filename}`;
        const attachmentType = this.getAttachmentType(file.mimetype);

        let actualMessageId = messageId;

        // If messageId is 'temp' or invalid, create a new message first
        if (!messageId || messageId === 'temp' || messageId === '') {
            if (!senderId) {
                throw new Error('senderId is required when messageId is not provided');
            }

            // Create a new message for this attachment (no content text - just the attachment)
            const newMessage = await this.prisma.message.create({
                data: {
                    content: null, // No text content - just the attachment
                    senderId,
                    receiverId: receiverId || undefined,
                    groupId: groupId || undefined,
                },
            });

            console.log('💾 Created new message for attachment:', {
                messageId: newMessage.id,
                senderId: newMessage.senderId,
                receiverId: newMessage.receiverId,
                groupId: newMessage.groupId,
            });

            actualMessageId = newMessage.id;
        } else {
            // Verify message exists
            const message = await this.prisma.message.findUnique({
                where: { id: messageId },
            });

            if (!message) {
                throw new Error(`Message with id ${messageId} not found`);
            }
        }

        const attachment = await this.prisma.attachment.create({
            data: {
                messageId: actualMessageId,
                type: attachmentType,
                url,
                filename: file.originalname,
                size: file.size,
            },
            include: {
                message: {
                    include: {
                        sender: true,
                        receiver: true,
                        group: true,
                        attachments: true,
                    },
                },
            },
        });

        console.log('💾 Attachment stored in database:', {
            id: attachment.id,
            messageId: attachment.messageId,
            type: attachment.type,
            filename: attachment.filename,
            size: attachment.size,
            url: attachment.url,
            messageExists: !!attachment.message,
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

    async getAllAttachments(messageId?: string) {
        const where = messageId ? { messageId } : {};
        return this.prisma.attachment.findMany({
            where,
            include: {
                message: {
                    include: {
                        sender: true,
                        receiver: true,
                        group: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getAllMessages(userId?: string, groupId?: string) {
        const where: any = { isDeleted: false };
        
        if (userId) {
            where.OR = [
                { senderId: userId },
                { receiverId: userId },
            ];
        }
        
        if (groupId) {
            where.groupId = groupId;
        }

        return this.prisma.message.findMany({
            where,
            include: {
                sender: true,
                receiver: true,
                group: true,
                replyTo: {
                    include: {
                        sender: true,
                    },
                },
                attachments: true,
                voiceNote: true,
                reactions: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 1000, // Limit to prevent huge responses
        });
    }

    async cleanupOrphanedAttachments() {
        console.log('🧹 Starting cleanup of orphaned attachments...');
        
        // Find all attachments
        const allAttachments = await this.prisma.attachment.findMany({
            include: {
                message: true,
            },
        });

        let deletedCount = 0;
        let fileDeletedCount = 0;

        for (const attachment of allAttachments) {
            // Check if message exists
            if (!attachment.message) {
                console.log(`❌ Orphaned attachment found: ${attachment.id} (message ${attachment.messageId} not found)`);
                
                // Delete file from disk
                const filePath = path.join(this.getUploadPath(), attachment.url.replace('/uploads/', ''));
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        fileDeletedCount++;
                        console.log(`  ✅ Deleted file: ${filePath}`);
                    } catch (error) {
                        console.error(`  ❌ Failed to delete file: ${filePath}`, error);
                    }
                }

                // Delete attachment record
                await this.prisma.attachment.delete({
                    where: { id: attachment.id },
                });
                deletedCount++;
            } else {
                // Check if file exists on disk
                const filePath = path.join(this.getUploadPath(), attachment.url.replace('/uploads/', ''));
                if (!fs.existsSync(filePath)) {
                    console.log(`⚠️ Attachment record exists but file missing: ${attachment.id}`);
                    // Optionally delete the record if file is missing
                    // await this.prisma.attachment.delete({ where: { id: attachment.id } });
                }
            }
        }

        // Clean up orphaned voice notes
        const allVoiceNotes = await this.prisma.voiceNote.findMany({
            include: {
                message: true,
            },
        });

        for (const voiceNote of allVoiceNotes) {
            if (!voiceNote.message) {
                console.log(`❌ Orphaned voice note found: ${voiceNote.id}`);
                
                const filePath = path.join(this.getUploadPath(), voiceNote.url.replace('/uploads/', ''));
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        fileDeletedCount++;
                    } catch (error) {
                        console.error(`Failed to delete voice note file: ${filePath}`, error);
                    }
                }

                await this.prisma.voiceNote.delete({
                    where: { id: voiceNote.id },
                });
                deletedCount++;
            }
        }

        console.log(`✅ Cleanup complete: ${deletedCount} orphaned records deleted, ${fileDeletedCount} files removed`);

        return {
            deletedAttachments: deletedCount,
            deletedFiles: fileDeletedCount,
        };
    }

    async getFileStats() {
        const totalAttachments = await this.prisma.attachment.count();
        const totalMessages = await this.prisma.message.count({ where: { isDeleted: false } });
        const totalVoiceNotes = await this.prisma.voiceNote.count();
        
        const attachmentsByType = await this.prisma.attachment.groupBy({
            by: ['type'],
            _count: true,
        });

        // Calculate total size
        const allAttachments = await this.prisma.attachment.findMany({
            select: { size: true },
        });
        const totalSize = allAttachments.reduce((sum, att) => sum + att.size, 0);

        // Get upload directory size
        let diskSize = 0;
        const uploadPath = this.getUploadPath();
        if (fs.existsSync(uploadPath)) {
            const files = fs.readdirSync(uploadPath);
            for (const file of files) {
                const filePath = path.join(uploadPath, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isFile()) {
                        diskSize += stats.size;
                    }
                } catch (error) {
                    console.error(`Error reading file ${filePath}:`, error);
                }
            }
        }

        return {
            totalAttachments,
            totalMessages,
            totalVoiceNotes,
            attachmentsByType: attachmentsByType.map(item => ({
                type: item.type,
                count: item._count,
            })),
            totalSize,
            diskSize,
            totalSizeFormatted: this.formatBytes(totalSize),
            diskSizeFormatted: this.formatBytes(diskSize),
        };
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}
