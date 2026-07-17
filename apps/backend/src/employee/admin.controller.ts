import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('employees')
  async getEmployees(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('status') status: string = ''
  ) {
    return this.adminService.getEmployees(page, limit, search, status);
  }

  @Get('reports/attendance')
  async getAttendanceReport(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getAttendanceReport(page, limit, search, startDate, endDate);
  }

  @Post('employee')
  async createEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.adminService.createEmployee(createEmployeeDto);
  }

  @Put('employee/:id')
  async updateEmployee(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.adminService.updateEmployee(id, updateEmployeeDto);
  }

  @Post('employee/bulk')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBulkEmployees(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.uploadBulkEmployees(file);
  }
}
