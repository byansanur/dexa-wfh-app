import { Controller, Post, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(@Body('userId') userId: string) {
    // For MVP, if no userId is provided, we simulate a default user ID
    const actualUserId = userId || '123e4567-e89b-12d3-a456-426614174000';
    return this.attendanceService.clockIn(actualUserId);
  }

  @Post('clock-out')
  async clockOut(@Body('userId') userId: string) {
    const actualUserId = userId || '123e4567-e89b-12d3-a456-426614174000';
    return this.attendanceService.clockOut(actualUserId);
  }
}
