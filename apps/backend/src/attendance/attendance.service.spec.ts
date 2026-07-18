import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationGateway } from '../notification/notification.gateway';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: PrismaService;
  let amqpClient: ClientProxy;
  let notification: NotificationGateway;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      attendance: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
    };

    const mockAmqpClient = {
      emit: jest.fn().mockReturnValue(of(true)),
    };

    const mockNotificationGateway = {
      server: {
        emit: jest.fn(),
      },
      notifyAutoClockOut: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'RABBITMQ_SERVICE', useValue: mockAmqpClient },
        { provide: NotificationGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prisma = module.get<PrismaService>(PrismaService);
    amqpClient = module.get<ClientProxy>('RABBITMQ_SERVICE');
    notification = module.get<NotificationGateway>(NotificationGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clockIn', () => {
    it('should successfully clock in a user', async () => {
      const userId = 'user-1';
      const location = '-6.200000,106.816666';
      const mockUser = { id: userId, attendanceType: 'MULTI' };
      const mockAttendance = { id: 'att-1', userId, clockIn: new Date(), clockInLocation: location };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.create as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await service.clockIn(userId, location);

      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          clockInLocation: location,
        }),
        include: { user: true },
      });
      expect(notification.server.emit).toHaveBeenCalledWith('AttendanceLogged', mockAttendance);
      expect(amqpClient.emit).toHaveBeenCalledWith('AttendanceLogged', expect.objectContaining({
        action: 'CLOCK_IN',
        userId,
      }));
      expect(result).toEqual(mockAttendance);
    });

    it('should throw BadRequestException if user already has active clock-in session', async () => {
      const userId = 'user-1';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({ id: 'att-1', clockOut: null });

      await expect(service.clockIn(userId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for SINGLE shift user clocking in twice', async () => {
      const userId = 'user-1';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, attendanceType: 'SINGLE' });
      // No active session (clockOut is NOT null), but has an existing record today
      (prisma.attendance.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // for activeSession check
        .mockResolvedValueOnce({ id: 'att-old' }); // for existingToday check

      await expect(service.clockIn(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('clockOut', () => {
    it('should successfully clock out a user', async () => {
      const userId = 'user-1';
      const location = '-6.200000,106.816666';
      const activeSession = { id: 'att-1', userId, clockIn: new Date(), clockOut: null };
      const mockAttendance = { ...activeSession, clockOut: new Date(), clockOutLocation: location };

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(activeSession);
      (prisma.attendance.update as jest.Mock).mockResolvedValue(mockAttendance);

      const result = await service.clockOut(userId, location);

      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: activeSession.id },
        data: expect.objectContaining({
          clockOutLocation: location,
        }),
        include: { user: true },
      });
      expect(notification.server.emit).toHaveBeenCalledWith('AttendanceLogged', mockAttendance);
      expect(result).toEqual(mockAttendance);
    });

    it('should throw BadRequestException if user has no active clock-in session', async () => {
      const userId = 'user-1';
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.clockOut(userId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('autoClockOutOvertime', () => {
    it('should perform auto clock out for active sessions', async () => {
      const activeSessions = [
        { id: 'att-1', userId: 'user-1' },
        { id: 'att-2', userId: 'user-2' },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(activeSessions);

      await service.autoClockOutOvertime();

      expect(prisma.attendance.updateMany).toHaveBeenCalled();
      expect(notification.notifyAutoClockOut).toHaveBeenCalledWith('user-1');
      expect(notification.notifyAutoClockOut).toHaveBeenCalledWith('user-2');
      expect(notification.server.emit).toHaveBeenCalledWith('AttendanceLogged', { autoClockOut: true });
    });
  });
});
