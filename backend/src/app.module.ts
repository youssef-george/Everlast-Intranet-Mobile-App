import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ChatModule } from './modules/chat/chat.module';
import { GroupsModule } from './modules/groups/groups.module';
import { FilesModule } from './modules/files/files.module';
import { SearchModule } from './modules/search/search.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QuickLinksModule } from './modules/quick-links/quick-links.module';
import { PrismaService } from './common/prisma.service';
import { HealthController } from './health.controller';

@Module({
    imports: [UsersModule, ChatModule, GroupsModule, FilesModule, SearchModule, DepartmentsModule, NotificationsModule, QuickLinksModule],
    controllers: [HealthController],
    providers: [PrismaService],
})
export class AppModule { }
