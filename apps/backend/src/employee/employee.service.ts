import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationGateway } from '../notification/notification.gateway';
import { StorageService } from '../storage/storage.service';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('RABBITMQ_SERVICE') private readonly amqpClient: ClientProxy,
    private readonly notificationGateway: NotificationGateway,
    private readonly storageService: StorageService,
  ) {}

  async updateProfile(userId: string, dto: any, file?: Express.Multer.File) {
    
    if (file) {
      const uploadedUrl = await this.storageService.uploadFile(file);
      dto.photoUrl = uploadedUrl;
    }

    const updatedUser = await this.prisma.user.upsert({
      where: { id: userId },
      update: dto,
      create: {
        id: userId,
        email: 'test@dexa.com',
        password: 'hashedpassword',
        name: 'Test Employee',
        role: 'EMPLOYEE',
        phone: dto.phone,
        photoUrl: dto.photoUrl,
      },
    });

    this.notificationGateway.notifyProfileUpdated(updatedUser);

    this.amqpClient.emit('ProfileUpdated', {
      userId,
      action: 'UPDATE_PROFILE',
      changes: dto,
      timestamp: new Date().toISOString(),
    }).subscribe({
      error: (err) => console.error('RabbitMQ Emit Error:', err)
    });

    return updatedUser;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async changePassword(userId: string, currentPassword?: string, newPassword?: string) {
    if (!currentPassword || !newPassword) {
      throw new UnauthorizedException('Password is required');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Kata sandi saat ini tidak valid');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async getAttendanceHistory(userId: string, startDate?: string, endDate?: string) {
    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    } else {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      whereClause.date = { gte: firstDay, lte: lastDay };
    }

    return this.prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
    });
  }
}
