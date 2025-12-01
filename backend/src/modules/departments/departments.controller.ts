import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { DepartmentsService, CreateDepartmentDto } from './departments.service';

@Controller('departments')
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) { }

    @Get()
    async getAllDepartments() {
        return this.departmentsService.getAllDepartments();
    }

    @Post()
    async createDepartment(@Body() dto: CreateDepartmentDto & { requesterId?: string }) {
        if (!dto.requesterId) {
            throw new Error('Requester ID is required');
        }
        return this.departmentsService.createDepartment(dto, dto.requesterId);
    }

    @Get('users')
    async getDepartmentUsers(@Query('name') departmentName: string) {
        return this.departmentsService.getDepartmentUsers(departmentName);
    }
}

