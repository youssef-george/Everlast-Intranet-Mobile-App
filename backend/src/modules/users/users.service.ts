import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface CreateUserDto {
    name: string;
    email: string;
    phone?: string;
    jobTitle: string;
    department: string;
    role?: string;
    profilePicture?: string;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    role?: string;
    profilePicture?: string;
}

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async getAllUsers(includeDeactivated = false) {
        return this.prisma.user.findMany({
            where: includeDeactivated ? {} : { accountState: 'ACTIVE' },
            orderBy: { name: 'asc' },
        });
    }

    async getUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async createUser(dto: CreateUserDto, requesterId?: string) {
        // If requesterId is provided, check permissions
        if (requesterId) {
            const requester = await this.prisma.user.findUnique({
                where: { id: requesterId },
            });

            if (!requester || requester.role !== 'SUPER_ADMIN') {
                throw new Error('Only Super Admin can create employees');
            }
        }

        return this.prisma.user.create({
            data: {
                ...dto,
                role: dto.role || 'EMPLOYEE',
                accountState: 'ACTIVE',
            },
        });
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        return this.prisma.user.update({
            where: { id },
            data: dto,
        });
    }

    async deactivateUser(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { accountState: 'DEACTIVATED', isOnline: false },
        });
    }

    async activateUser(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { accountState: 'ACTIVE' },
        });
    }

    async updateOnlineStatus(id: string, isOnline: boolean) {
        return this.prisma.user.update({
            where: { id },
            data: {
                isOnline,
                lastSeen: isOnline ? null : new Date(),
            },
        });
    }

    async searchUsers(query: string) {
        return this.prisma.user.findMany({
            where: {
                AND: [
                    { accountState: 'ACTIVE' },
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                            { jobTitle: { contains: query, mode: 'insensitive' } },
                            { department: { contains: query, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            orderBy: { name: 'asc' },
        });
    }
}
