import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

export interface CreateDepartmentDto {
    name: string;
    description?: string;
}

@Injectable()
export class DepartmentsService {
    constructor(private prisma: PrismaService) { }

    async getAllDepartments() {
        // Get unique departments from users
        const users = await this.prisma.user.findMany({
            where: { accountState: 'ACTIVE' },
            select: { department: true },
            distinct: ['department'],
        });

        return users.map(u => ({ name: u.department }));
    }

    async createDepartment(dto: CreateDepartmentDto, requesterId: string) {
        // Check if requester is SUPER_ADMIN
        const requester = await this.prisma.user.findUnique({
            where: { id: requesterId },
        });

        if (!requester || requester.role !== 'SUPER_ADMIN') {
            throw new ForbiddenException('Only Super Admin can create departments');
        }

        // Department is just a string in the User model, so we just return it
        // In a real system, you'd have a Department table
        return { name: dto.name, description: dto.description };
    }

    async getDepartmentUsers(departmentName: string) {
        return this.prisma.user.findMany({
            where: {
                department: departmentName,
                accountState: 'ACTIVE',
            },
        });
    }
}

