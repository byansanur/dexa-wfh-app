import { Controller, Get, Post, Put, Body, Param, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
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

  @Get('employees')
  async getEmployees() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await this.prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      include: {
        Attendances: {
          where: { date: today },
          orderBy: { createdAt: 'desc' }, // Order by latest to pick the most recent session
        },
      },
    });

    return employees.map((emp) => {
      const latestAttendance = emp.Attendances[0]; // Gets the latest session
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
