import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import * as bcrypt from 'bcryptjs';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard-stats')
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

  @Get('employees')
  async getEmployees(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('status') status: string = ''
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const take = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * take;

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
        skip,
        take,
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

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  @Get('reports/attendance')
  async getAttendanceReport(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const take = parseInt(limit, 10) || 10;
    const pageNum = parseInt(page, 10) || 1;
    const skip = (pageNum - 1) * take;

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
        skip,
        take,
        orderBy: { date: 'desc' },
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

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  @Post('employee')
  async createEmployee(@Body() body: any) {
    const hashedPassword = await bcrypt.hash(body.password || 'wfh123', 10);
    return this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: body.role || 'EMPLOYEE',
        phone: body.phone,
        attendanceType: body.attendanceType,
      }
    });
  }

  @Put('employee/:id')
  async updateEmployee(@Param('id') id: string, @Body() body: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        role: body.role,
        phone: body.phone,
        attendanceType: body.attendanceType,
      }
    });
  }

  @Post('employee/bulk')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBulkEmployees(@UploadedFile() file: Express.Multer.File) {
    const results: any[] = [];
    const csvParser = require('csv-parser');
    
    return new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csvParser())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            const defaultPassword = await bcrypt.hash('wfh123', 10);
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
