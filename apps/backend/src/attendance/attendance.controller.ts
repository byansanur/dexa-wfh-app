import { Controller, Post, Get, UseGuards, Req, Body } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceDto } from './dto/attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService
  ) {}

  @Post('clock-in')
  async clockIn(@Req() req: any, @Body() body: AttendanceDto) {
    return this.attendanceService.clockIn(req.user.userId, body.location);
  }

  @Post('clock-out')
  async clockOut(@Req() req: any, @Body() body: AttendanceDto) {
    return this.attendanceService.clockOut(req.user.userId, body.location);
  }

  @Get('history')
  async getHistory(@Req() req: any) {
    return this.prisma.attendance.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
    });
  }
}
