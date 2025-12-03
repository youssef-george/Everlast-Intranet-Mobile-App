import { Module, forwardRef } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaService } from '../../common/prisma.service';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [forwardRef(() => ChatModule)],
    controllers: [FilesController],
    providers: [FilesService, PrismaService],
    exports: [FilesService],
})
export class FilesModule { }
