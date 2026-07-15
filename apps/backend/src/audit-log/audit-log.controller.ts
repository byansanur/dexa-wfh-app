import { Controller, Get, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @EventPattern('ProfileUpdated')
  async handleProfileUpdated(@Payload() data: any) {
    await this.auditLogService.saveLog({ type: 'PROFILE_UPDATED', ...data });
  }

  @EventPattern('AttendanceLogged')
  async handleAttendanceLogged(@Payload() data: any) {
    await this.auditLogService.saveLog({ type: 'ATTENDANCE_LOGGED', ...data });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getProfileLogs() {
    return this.auditLogService.findProfileLogs();
  }

  @Get('attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAttendanceLogs() {
    return this.auditLogService.findAttendanceLogs();
  }
}
