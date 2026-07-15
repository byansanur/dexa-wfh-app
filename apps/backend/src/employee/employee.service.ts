import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationGateway } from '../notification/notification.gateway';
import { StorageService } from '../storage/storage.service';

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
    });

    return updatedUser;
  }
}
