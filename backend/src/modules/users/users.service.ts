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
    phone?: string | null;
    avayaNumber?: string | null;
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
        console.log('🔍 Starting createUser:', { 
            requesterId, 
            dto: { name: dto.name, email: dto.email, department: dto.department, role: dto.role } 
        });
        
        // If requesterId is provided, check permissions
        if (requesterId) {
            console.log('🔍 Checking requester permissions...');
            try {
                const requester = await this.prisma.user.findUnique({
                    where: { id: requesterId },
                });

                if (!requester) {
                    console.error('❌ Requester not found with ID:', requesterId);
                    console.error('❌ This usually means:');
                    console.error('   1. You haven\'t created the super admin account yet');
                    console.error('   2. OR the logged-in user was deleted from the database');
                    console.error('   🔧 FIX: Run "backend\\create-admin.bat" to create a super admin');
                    throw new Error('Requester not found. Please contact your administrator.');
                }

                console.log('✅ Requester found:', { name: requester.name, role: requester.role });

                if (requester.role !== 'SUPER_ADMIN' && requester.role !== 'ADMIN') {
                    console.error('❌ Permission denied. Requester role:', requester.role);
                    throw new Error('Only Super Admin or Admin can create employees');
                }

                console.log('✅ Permission check passed');
            } catch (error: any) {
                console.error('❌ Error checking permissions:', error.message);
                throw error;
            }
        } else {
            console.warn('⚠️ No requesterId provided - skipping permission check');
        }

        try {
            console.log('🔍 Creating user in database with data:', {
                name: dto.name,
                email: dto.email,
                department: dto.department,
                role: dto.role || 'EMPLOYEE',
                jobTitle: dto.jobTitle,
            });
            
            const newUser = await this.prisma.user.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    phone: dto.phone || null,
                    jobTitle: dto.jobTitle,
                    department: dto.department,
                    role: dto.role || 'EMPLOYEE',
                    accountState: 'ACTIVE',
                    profilePicture: dto.profilePicture || null,
                    isOnline: false,
                },
            });
            
            console.log('✅ User created successfully:', {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                department: newUser.department,
            });
            
            return newUser;
        } catch (error: any) {
            console.error('❌ Database error creating user:');
            console.error('   Error code:', error.code);
            console.error('   Error message:', error.message);
            
            if (error.code === 'P2002') {
                console.error('   Duplicate field:', error.meta?.target);
                throw new Error('Email already exists in the database');
            }
            
            if (error.code === 'P2003') {
                console.error('   Foreign key constraint failed');
                throw new Error('Invalid reference data');
            }
            
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    async updateUser(id: string, dto: UpdateUserDto) {
        // Filter out undefined values to only update provided fields
        // null values are allowed to clear fields
        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.email !== undefined) updateData.email = dto.email;
        if (dto.phone !== undefined) updateData.phone = dto.phone; // Can be string or null
        if (dto.avayaNumber !== undefined) updateData.avayaNumber = dto.avayaNumber; // Can be string or null
        if (dto.jobTitle !== undefined) updateData.jobTitle = dto.jobTitle;
        if (dto.department !== undefined) updateData.department = dto.department;
        if (dto.role !== undefined) updateData.role = dto.role;
        if (dto.profilePicture !== undefined) updateData.profilePicture = dto.profilePicture;

        return this.prisma.user.update({
            where: { id },
            data: updateData,
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

    async globalSearch(query: string, userId: string) {
        // Search for users and group chats
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    { accountState: 'ACTIVE' },
                    { id: { not: userId } }, // Exclude current user
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

        const groups = await this.prisma.group.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                members: {
                    some: { userId },
                },
            },
            orderBy: { name: 'asc' },
        });

        return {
            users,
            groups,
        };
    }
}
