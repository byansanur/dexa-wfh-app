import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcryptjs';
import { Readable } from 'stream';
import { getPaginationMeta } from '../common/utils/pagination.util';
import { startOfDay } from 'date-fns';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async getDashboardStats() {
    const today = startOfDay(new Date());

    const [totalEmployees, presentToday, topPunctual] = await Promise.all([
      this.prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      this.prisma.user.count({ where: { role: 'EMPLOYEE', Attendances: { some: { date: today } } } }),
      this.prisma.attendance.findMany({
        where: { date: today },
        orderBy: { clockIn: 'asc' },
        distinct: ['userId'],
        take: 3,
        include: { user: { select: { name: true, email: true, photoUrl: true } } }
      })
    ]);

    const absentToday = totalEmployees - presentToday;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      topPunctual: topPunctual.map(att => ({
        id: att.id,
        clockIn: att.clockIn,
        name: att.user.name,
        email: att.user.email,
        photoUrl: att.user.photoUrl
      }))
    };
  }

  async getEmployees(page: string = '1', limit: string = '10', search: string = '', status: string = '') {
    const today = startOfDay(new Date());
    const pagination = getPaginationMeta(0, page, limit);

    const where: any = { role: 'EMPLOYEE' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'Hadir') {
      where.Attendances = { some: { date: today, clockOut: null } };
    } else if (status === 'Selesai') {
      where.Attendances = { some: { date: today, clockOut: { not: null } } };
    } else if (status === 'Belum Absen') {
      where.Attendances = { none: { date: today } };
    } else if (status === 'Semua Hadir') {
      where.Attendances = { some: { date: today } };
    }

    const [employees, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: 'asc' },
        include: {
          Attendances: {
            where: { date: today },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.user.count({ where })
    ]);

    const data = employees.map((emp) => {
      const latestAttendance = emp.Attendances[0];
      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        photoUrl: emp.photoUrl,
        attendanceType: emp.attendanceType,
        clockIn: latestAttendance?.clockIn || null,
        clockOut: latestAttendance?.clockOut || null,
      };
    });
    
    const meta = getPaginationMeta(total, page, limit).meta;

    return { data, meta };
  }

  async getAttendanceReport(page: string = '1', limit: string = '10', search: string = '', startDate?: string, endDate?: string) {
    const pagination = getPaginationMeta(0, page, limit);
    const whereClause: any = {};
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    if (search) {
      whereClause.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [attendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where: whereClause,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ date: 'desc' }, { clockIn: 'desc' }],
        include: {
          user: { select: { name: true, email: true, attendanceType: true } }
        }
      }),
      this.prisma.attendance.count({ where: whereClause })
    ]);

    const data = attendances.map(att => ({
      id: att.id,
      userId: att.userId,
      date: att.date,
      clockIn: att.clockIn,
      clockOut: att.clockOut,
      name: att.user.name,
      email: att.user.email,
      attendanceType: att.user.attendanceType,
    }));
    
    const meta = getPaginationMeta(total, page, limit).meta;

    return { data, meta };
  }

  async createEmployee(dto: CreateEmployeeDto) {
    const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || 'wfh123';
    const hashedPassword = await bcrypt.hash(dto.password || defaultPassword, 10);
    
    const newEmployee = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'EMPLOYEE',
        phone: dto.phone,
        attendanceType: dto.attendanceType,
      }
    });
    this.notificationGateway.notifyProfileUpdated({ name: `Admin (via Dashboard)` });
    return newEmployee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        phone: dto.phone,
        attendanceType: dto.attendanceType,
      }
    });
    this.notificationGateway.notifyProfileUpdated(updatedUser);
    return updatedUser;
  }

  async uploadBulkEmployees(file: Express.Multer.File) {
    const results: any[] = [];
    const csvParser = require('csv-parser');
    
    return new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csvParser())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            const defaultPassword = await bcrypt.hash(process.env.DEFAULT_EMPLOYEE_PASSWORD || 'wfh123', 10);
            const data = results.map((row) => ({
              email: row.email,
              name: row.name,
              password: defaultPassword,
              role: 'EMPLOYEE',
              attendanceType: row.attendanceType || 'SINGLE',
            }));

            await this.prisma.user.createMany({
              data,
              skipDuplicates: true,
            });
            resolve({ message: `Successfully imported ${data.length} employees` });
          } catch (e) {
            reject(e);
          }
        });
    });
  }
}
