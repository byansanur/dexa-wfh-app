import { Injectable, Inject } from '@nestjs/common';
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      update: {}, // Don't override existing clockIn if pressed again
      create: {
        userId,
        date: today,
        clockIn: new Date(),
      },
      include: {
        user: true, // Include user data for the websocket notification
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.update({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
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
}
