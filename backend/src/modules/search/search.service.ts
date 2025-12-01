import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) { }

    async globalSearch(query: string) {
        if (!query || query.trim().length === 0) {
            return {
                users: [],
                groups: [],
            };
        }

        const searchTerm = query.trim();

        // Search users
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    {
                        accountState: 'ACTIVE',
                    },
                    {
                        OR: [
                            { name: { contains: searchTerm, mode: 'insensitive' } },
                            { email: { contains: searchTerm, mode: 'insensitive' } },
                            { jobTitle: { contains: searchTerm, mode: 'insensitive' } },
                            { department: { contains: searchTerm, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            take: 10,
            orderBy: {
                name: 'asc',
            },
        });

        // Search groups
        const groups = await this.prisma.group.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                ],
            },
            take: 10,
            orderBy: {
                name: 'asc',
            },
        });

        return {
            users,
            groups,
        };
    }
}

