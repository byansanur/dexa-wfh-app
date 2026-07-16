import { Controller, Put, Body, UseInterceptors, UploadedFile, UseGuards, Req, Get, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Put('profile')
  @UseInterceptors(FileInterceptor('photo'))
  async updateProfile(
    @Req() req: any,
    @Body() body: { phone: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.employeeService.updateProfile(req.user.userId, {
      phone: body.phone,
    }, file);
  }

  @Get('attendance/history')
  async getAttendanceHistory(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.employeeService.getAttendanceHistory(req.user.userId, startDate, endDate);
  }
}
