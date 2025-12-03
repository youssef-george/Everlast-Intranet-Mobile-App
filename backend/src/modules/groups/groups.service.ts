import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface CreateGroupDto {
    name: string;
    picture?: string;
    createdById: string;
    memberIds: string[];
}

export interface UpdateGroupDto {
    name?: string;
    picture?: string;
}

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async createGroup(dto: CreateGroupDto) {
        // Check if user can create groups (Super Admin or Admin)
        const creator = await this.prisma.user.findUnique({
            where: { id: dto.createdById },
        });

        if (!creator || creator.accountState === 'DEACTIVATED') {
            throw new Error('User not found or deactivated');
        }

        if (creator.role !== 'SUPER_ADMIN' && creator.role !== 'ADMIN') {
            throw new Error('Only Super Admin and Admin can create groups');
        }

        const group = await this.prisma.group.create({
            data: {
                name: dto.name,
                picture: dto.picture,
                createdById: dto.createdById,
            },
        });

        // Add creator as admin
        await this.prisma.groupMember.create({
            data: {
                groupId: group.id,
                userId: dto.createdById,
                role: 'admin',
            },
        });

        // Add other members (only active users)
        if (dto.memberIds && dto.memberIds.length > 0) {
            const activeUsers = await this.prisma.user.findMany({
                where: {
                    id: { in: dto.memberIds.filter((id) => id !== dto.createdById) },
                    accountState: 'ACTIVE',
                },
            });

            await Promise.all(
                activeUsers.map((user) =>
                    this.prisma.groupMember.create({
                        data: {
                            groupId: group.id,
                            userId: user.id,
                            role: 'member',
                        },
                    }),
                ),
            );
        }

        return this.getGroupById(group.id);
    }

    async getGroups(userId?: string) {
        if (userId) {
            // Get groups where user is a member
            const memberships = await this.prisma.groupMember.findMany({
                where: { userId },
                include: {
                    group: {
                        include: {
                            createdBy: true,
                            members: {
                                include: {
                                    user: true,
                                },
                            },
                            messages: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                include: {
                                    sender: true,
                                },
                            },
                        },
                    },
                },
            });

            return memberships.map((m) => m.group);
        }

        return this.prisma.group.findMany({
            include: {
                createdBy: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async getGroupById(id: string) {
        return this.prisma.group.findUnique({
            where: { id },
            include: {
                createdBy: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async updateGroup(id: string, dto: UpdateGroupDto) {
        return this.prisma.group.update({
            where: { id },
            data: dto,
            include: {
                createdBy: true,
                members: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async addMember(groupId: string, userId: string, requesterId: string) {
        // Check permissions
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
        });

        if (!requester || requester.accountState === 'DEACTIVATED') {
            throw new Error('Requester not found or deactivated');
        }

        const groupMember = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: requesterId,
                },
            },
        });

        const isAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'ADMIN';
        const isGroupAdmin = groupMember?.role === 'admin';

        if (!isAdmin && !isGroupAdmin) {
            throw new Error('Only admins can add members');
        }

        // Check if user is active
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.accountState === 'DEACTIVATED') {
            throw new Error('User not found or deactivated');
        }

        // Check if already a member
        const existing = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId,
                },
            },
        });

        if (existing) {
            throw new Error('User is already a member');
        }

        return this.prisma.groupMember.create({
            data: {
                groupId,
                userId,
                role: 'member',
            },
            include: {
                user: true,
                group: true,
            },
        });
    }

    async removeMember(groupId: string, userId: string, requesterId: string) {
        // Check permissions
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
        });

        if (!requester || requester.accountState === 'DEACTIVATED') {
            throw new Error('Requester not found or deactivated');
        }

        const requesterMember = await this.prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: requesterId,
                },
            },
        });

        const isAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'ADMIN';
        const isGroupAdmin = requesterMember?.role === 'admin';
        const isSelf = userId === requesterId;

        if (!isAdmin && !isGroupAdmin && !isSelf) {
            throw new Error('Insufficient permissions to remove member');
        }

        return this.prisma.groupMember.delete({
            where: {
                groupId_userId: {
                    groupId,
                    userId,
                },
            },
        });
    }

    async leaveGroup(groupId: string, userId: string) {
        // User is removing themselves, so they are both the target and the requester
        return this.removeMember(groupId, userId, userId);
    }

    async deleteGroup(id: string, requesterId: string) {
        // Only Super Admin can delete groups
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
        });

        if (!requester || requester.role !== 'SUPER_ADMIN') {
            throw new Error('Only Super Admin can delete groups');
        }

        // GroupMembers will be cascade deleted
        return this.prisma.group.delete({
            where: { id },
        });
    }
}
