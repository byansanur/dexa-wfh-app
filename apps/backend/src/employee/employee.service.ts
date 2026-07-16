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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const updateData: any = {};
    const changes: any = {};

    if (file) {
      const uploadedUrl = await this.storageService.uploadFile(file);
      updateData.photoUrl = uploadedUrl;
      if (user.photoUrl !== uploadedUrl) {
        changes.photoUrl = uploadedUrl;
      }
    }

    if (dto.phone !== undefined && user.phone !== dto.phone) {
      updateData.phone = dto.phone;
      changes.phone = dto.phone;
    }

    if (dto.currentPassword && dto.newPassword) {
      const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Kata sandi saat ini tidak valid');
      }
      updateData.password = await bcrypt.hash(dto.newPassword, 10);
      changes.password = 'updated';
    }

    if (Object.keys(updateData).length > 0) {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      this.notificationGateway.notifyProfileUpdated(updatedUser);

      if (Object.keys(changes).length > 0) {
        this.amqpClient.emit('ProfileUpdated', {
          userId,
          action: 'UPDATE_PROFILE',
          changes,
          timestamp: new Date().toISOString(),
        }).subscribe({
          error: (err) => console.error('RabbitMQ Emit Error:', err)
        });
      }

      return updatedUser;
    }

    return user;
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
