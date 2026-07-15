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

    const users = await this.prisma.user.findMany({
      include: {
        Attendances: {
          where: {
            date: today,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users;
  }

  @Post('employee')
  async createEmployee(@Body() body: any) {
    const hashedPassword = await bcrypt.hash(body.password || 'default123', 10);
    return this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: body.role || 'EMPLOYEE',
        phone: body.phone,
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
            const defaultPassword = await bcrypt.hash('dexa123', 10);
            const usersData = results.map(row => ({
              email: row.email,
              password: defaultPassword,
              name: row.name,
              role: row.role || 'EMPLOYEE',
              phone: row.phone,
            }));

            await this.prisma.user.createMany({
              data: usersData,
              skipDuplicates: true,
            });
            resolve({ message: `Successfully imported ${usersData.length} employees` });
          } catch (e) {
            reject(e);
          }
        });
    });
  }
}
