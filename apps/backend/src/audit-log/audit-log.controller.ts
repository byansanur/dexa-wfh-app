import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { AuditLogService } from './audit-log.service';

@Controller()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @EventPattern('ProfileUpdated')
  async handleProfileUpdated(@Payload() data: any) {
    await this.auditLogService.saveLog(data);
  }

  @EventPattern('AttendanceLogged')
  async handleAttendanceLogged(@Payload() data: any) {
    await this.auditLogService.saveLog(data);
  }
}
