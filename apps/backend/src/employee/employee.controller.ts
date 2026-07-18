import { Controller, Put, Body, UseInterceptors, UploadedFile, UseGuards, Req, Get, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Put('profile')
  @UseInterceptors(FileInterceptor('photo', {
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
  }))
  async updateProfile(
    @Req() req: any,
    @Body() body: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.employeeService.updateProfile(req.user.userId, body, file);
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.employeeService.getProfile(req.user.userId);
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
