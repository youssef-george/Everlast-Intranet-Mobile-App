import { Controller, Get, Post, Patch, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { QuickLinksService, CreateQuickLinkDto, UpdateQuickLinkDto } from './quick-links.service';

@Controller('quick-links')
export class QuickLinksController {
    constructor(private quickLinksService: QuickLinksService) { }

    @Get()
    async getAllQuickLinks() {
        try {
            return await this.quickLinksService.getAllQuickLinks();
        } catch (error: any) {
            console.error('Error in getAllQuickLinks controller:', error);
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
                throw new HttpException(
                    'QuickLink table does not exist. Please run: npx prisma migrate deploy',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw new HttpException(
                error.message || 'Failed to fetch quick links',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id')
    async getQuickLinkById(@Param('id') id: string) {
        try {
            return await this.quickLinksService.getQuickLinkById(id);
        } catch (error: any) {
            console.error('Error in getQuickLinkById controller:', error);
            throw new HttpException(
                error.message || 'Failed to fetch quick link',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post()
    async createQuickLink(@Body() dto: CreateQuickLinkDto & { requesterId?: string }) {
        try {
            return await this.quickLinksService.createQuickLink(dto, dto.requesterId);
        } catch (error: any) {
            console.error('Error in createQuickLink controller:', error);
            if (error.message?.includes('Only Super Admin')) {
                throw new HttpException(error.message, HttpStatus.FORBIDDEN);
            }
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
                throw new HttpException(
                    'QuickLink table does not exist. Please run: npx prisma migrate deploy',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            throw new HttpException(
                error.message || 'Failed to create quick link',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Patch(':id')
    async updateQuickLink(
        @Param('id') id: string,
        @Body() dto: UpdateQuickLinkDto & { requesterId?: string }
    ) {
        try {
            return await this.quickLinksService.updateQuickLink(id, dto, dto.requesterId);
        } catch (error: any) {
            console.error('Error in updateQuickLink controller:', error);
            if (error.message?.includes('Only Super Admin')) {
                throw new HttpException(error.message, HttpStatus.FORBIDDEN);
            }
            if (error.code === 'P2025') {
                throw new HttpException('Quick link not found', HttpStatus.NOT_FOUND);
            }
            throw new HttpException(
                error.message || 'Failed to update quick link',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete(':id')
    async deleteQuickLink(@Param('id') id: string, @Body() body: { requesterId?: string }) {
        try {
            return await this.quickLinksService.deleteQuickLink(id, body.requesterId);
        } catch (error: any) {
            console.error('Error in deleteQuickLink controller:', error);
            if (error.message?.includes('Only Super Admin')) {
                throw new HttpException(error.message, HttpStatus.FORBIDDEN);
            }
            if (error.code === 'P2025') {
                throw new HttpException('Quick link not found', HttpStatus.NOT_FOUND);
            }
            throw new HttpException(
                error.message || 'Failed to delete quick link',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

