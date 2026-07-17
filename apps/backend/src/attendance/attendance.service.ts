import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { getTodayWIB } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly amqpClient: ClientProxy,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async clockIn(userId: string) {
    const today = getTodayWIB();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // Cek apakah ada sesi absensi aktif yang belum clockOut
    const activeSession = await this.prisma.attendance.findFirst({
      where: {
        userId,
        date: today,
        clockOut: null,
      }
    });

    if (activeSession) {
      throw new BadRequestException('Anda memiliki sesi absen yang masih berjalan. Silakan Clock Out terlebih dahulu.');
    }

    if (user?.attendanceType === 'SINGLE') {
      const existingToday = await this.prisma.attendance.findFirst({
        where: { userId, date: today }
      });
      if (existingToday) {
        throw new BadRequestException('Anda hanya diizinkan melakukan absensi 1 kali dalam sehari (Single Shift).');
      }
    }

    const attendance = await this.prisma.attendance.create({
      data: {
        userId,
        date: today,
        clockIn: new Date(),
      },
      include: {
        user: true,
      }
    });

    // Notify Admin via WebSocket
    this.notificationGateway.server.emit('AttendanceLogged', attendance);

    // Save Audit Trail via RabbitMQ
    this.amqpClient.emit('AttendanceLogged', {
      action: 'CLOCK_IN',
      userId,
      timestamp: new Date(),
      data: attendance,
    }).subscribe({
      error: (err) => console.error('RabbitMQ Emit Error:', err)
    });

    return attendance;
  }

  async clockOut(userId: string) {
    // Cari sesi absensi aktif (belum clock out)
    const activeSession = await this.prisma.attendance.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!activeSession) {
      throw new BadRequestException('Anda belum melakukan Clock In atau sudah melakukan Clock Out sebelumnya.');
    }

    const attendance = await this.prisma.attendance.update({
      where: { id: activeSession.id },
      data: {
        clockOut: new Date(),
      },
      include: {
        user: true,
      }
    });

    // Notify Admin via WebSocket
    this.notificationGateway.server.emit('AttendanceLogged', attendance);

    // Save Audit Trail via RabbitMQ
    this.amqpClient.emit('AttendanceLogged', {
      action: 'CLOCK_OUT',
      userId,
      timestamp: new Date(),
      data: attendance,
    }).subscribe({
      error: (err) => console.error('RabbitMQ Emit Error:', err)
    });

    return attendance;
  }

  @Cron('59 59 23 * * *', { timeZone: 'Asia/Jakarta' })
  async autoClockOutOvertime() {
    const activeSessions = await this.prisma.attendance.findMany({
      where: { clockOut: null }
    });

    if (activeSessions.length > 0) {
      const now = new Date();
      await this.prisma.attendance.updateMany({
        where: { clockOut: null },
        data: { clockOut: now }
      });

      for (const session of activeSessions) {
        this.notificationGateway.notifyAutoClockOut(session.userId);
      }
      
      // Notify Admin via WebSocket to refresh Dashboard
      this.notificationGateway.server.emit('AttendanceLogged', { autoClockOut: true });
      
      console.log(`Auto Clock-Out performed for ${activeSessions.length} employees.`);
    }
  }
}
