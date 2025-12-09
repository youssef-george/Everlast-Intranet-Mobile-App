import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface CreateQuickLinkDto {
    name: string;
    url: string;
    order?: number;
}

export interface UpdateQuickLinkDto {
    name?: string;
    url?: string;
    order?: number;
}

@Injectable()
export class QuickLinksService {
    constructor(private prisma: PrismaService) { }

    async getAllQuickLinks() {
        try {
            // Debug: Check if quickLink exists
            if (!this.prisma.quickLink) {
                console.error('❌ quickLink model is undefined!');
                console.error('Available models:', Object.keys(this.prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')).join(', '));
                throw new Error('QuickLink model is not available in Prisma client. Please run: npx prisma generate');
            }
            return await this.prisma.quickLink.findMany({
                orderBy: { order: 'asc' },
            });
        } catch (error: any) {
            console.error('Error fetching quick links:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            // If table doesn't exist, return empty array
            if (error.code === 'P2021' || 
                error.message?.includes('does not exist') ||
                error.message?.includes('relation') ||
                error.message?.includes('table')) {
                console.warn('QuickLink table does not exist yet. Please run: npx prisma migrate deploy');
                return [];
            }
            throw error;
        }
    }

    async getQuickLinkById(id: string) {
        return this.prisma.quickLink.findUnique({
            where: { id },
        });
    }

    async createQuickLink(dto: CreateQuickLinkDto, requesterId?: string) {
        try {
            // Check if requester is SUPER_ADMIN
            if (requesterId) {
                const requester = await this.prisma.user.findUnique({
                    where: { id: requesterId },
                });

                if (!requester) {
                    throw new Error('Requester not found');
                }

                if (requester.role !== 'SUPER_ADMIN') {
                    throw new Error('Only Super Admin can create quick links');
                }
            }

            // Get the maximum order value
            let newOrder = dto.order;
            if (newOrder === undefined) {
                try {
                    const maxOrder = await this.prisma.quickLink.aggregate({
                        _max: { order: true },
                    });
                    newOrder = (maxOrder._max.order ?? -1) + 1;
                } catch (error: any) {
                    // If table doesn't exist or is empty, start with 0
                    if (error.code === 'P2021' || 
                        error.message?.includes('does not exist') ||
                        error.message?.includes('relation') ||
                        error.message?.includes('table')) {
                        console.warn('QuickLink table does not exist yet. Please run: npx prisma migrate deploy');
                        newOrder = 0;
                    } else {
                        // If aggregate fails for other reasons, try counting instead
                        try {
                            const count = await this.prisma.quickLink.count();
                            newOrder = count;
                        } catch (countError: any) {
                            // If count also fails, default to 0
                            console.warn('Could not determine order, defaulting to 0');
                            newOrder = 0;
                        }
                    }
                }
            }

            // Debug: Check if quickLink exists
            if (!this.prisma.quickLink) {
                console.error('❌ quickLink model is undefined in createQuickLink!');
                console.error('Available models:', Object.keys(this.prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')).join(', '));
                throw new Error('QuickLink model is not available in Prisma client. Please run: npx prisma generate');
            }
            return await this.prisma.quickLink.create({
                data: {
                    name: dto.name,
                    url: dto.url,
                    order: newOrder,
                },
            });
        } catch (error: any) {
            console.error('Error creating quick link:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            // If table doesn't exist, provide helpful error message
            if (error.code === 'P2021' || 
                error.message?.includes('does not exist') ||
                error.message?.includes('relation') ||
                error.message?.includes('table')) {
                throw new Error('QuickLink table does not exist. Please run: npx prisma migrate deploy');
            }
            throw error;
        }
    }

    async updateQuickLink(id: string, dto: UpdateQuickLinkDto, requesterId?: string) {
        // Check if requester is SUPER_ADMIN
        if (requesterId) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requesterId },
            });

            if (!requester) {
                throw new Error('Requester not found');
            }

            if (requester.role !== 'SUPER_ADMIN') {
                throw new Error('Only Super Admin can update quick links');
            }
        }

        return this.prisma.quickLink.update({
            where: { id },
            data: dto,
        });
    }

    async deleteQuickLink(id: string, requesterId?: string) {
        // Check if requester is SUPER_ADMIN
        if (requesterId) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requesterId },
            });

            if (!requester) {
                throw new Error('Requester not found');
            }

            if (requester.role !== 'SUPER_ADMIN') {
                throw new Error('Only Super Admin can delete quick links');
            }
        }

        return this.prisma.quickLink.delete({
            where: { id },
        });
    }
}

