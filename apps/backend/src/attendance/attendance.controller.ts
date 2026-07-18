import { Controller, Post, Get, UseGuards, Req, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService
  ) {}

  @Post('clock-in')
  async clockIn(@Req() req: any, @Body('location') location?: string) {
    return this.attendanceService.clockIn(req.user.userId, location);
  }

  @Post('clock-out')
  async clockOut(@Req() req: any, @Body('location') location?: string) {
    return this.attendanceService.clockOut(req.user.userId, location);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.prisma.attendance.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
    });
  }
}
