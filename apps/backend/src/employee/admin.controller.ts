import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('admin')
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
}
