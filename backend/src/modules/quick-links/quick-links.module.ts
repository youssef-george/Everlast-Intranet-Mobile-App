import { Module } from '@nestjs/common';
import { QuickLinksController } from './quick-links.controller';
import { QuickLinksService } from './quick-links.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
    controllers: [QuickLinksController],
    providers: [QuickLinksService, PrismaService],
    exports: [QuickLinksService],
})
export class QuickLinksModule { }

