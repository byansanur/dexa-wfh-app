import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationGateway } from '../notification/notification.gateway';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: PrismaService;
  let amqpClient: ClientProxy;
  let notification: NotificationGateway;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        update: jest.fn(),
      },
    };
    
    const mockAmqpClient = {
      emit: jest.fn(),
    };
    
    const mockNotificationGateway = {
      notifyProfileUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'RABBITMQ_SERVICE', useValue: mockAmqpClient },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prisma = module.get<PrismaService>(PrismaService);
    amqpClient = module.get<ClientProxy>('RABBITMQ_SERVICE');
    notification = module.get<NotificationGateway>(NotificationGateway);
  });

  describe('updateProfile', () => {
    it('should update user in DB, notify admin via WebSocket, and publish event to RabbitMQ', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const dto = { phone: '08123456789', photoUrl: 'http://test.com/img.jpg' };
      const updatedUser = { id: userId, ...dto, email: 'test@dexa.com' };

      // Mock Prisma response
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Execute method
      const result = await service.updateProfile(userId, dto);

      // 1. Verify Database was updated
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: dto,
      });

      // 2. Verify WebSocket event was broadcasted to Admin
      expect(notification.notifyProfileUpdated).toHaveBeenCalledWith(updatedUser);

      // 3. Verify Event was published to RabbitMQ Queue
      expect(amqpClient.emit).toHaveBeenCalledWith('ProfileUpdated', expect.objectContaining({
        userId,
        action: 'UPDATE_PROFILE',
        changes: dto,
        timestamp: expect.any(String),
      }));

      // 4. Verify returned data
      expect(result).toEqual(updatedUser);
    });
  });
});
