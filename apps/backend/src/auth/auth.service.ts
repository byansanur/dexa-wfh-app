import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    // Seed Admin
    const adminExists = await this.prisma.user.findUnique({ where: { email: 'admin@dexa.com' } });
    if (!adminExists) {
      await this.prisma.user.create({
        data: {
          email: 'admin@dexa.com',
          password: await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10),
          name: 'Super Admin HR',
          role: 'ADMIN',
        }
      });
    }

    // Seed Employee
    const employeeExists = await this.prisma.user.findUnique({ where: { email: 'employee@dexa.com' } });
    if (!employeeExists) {
      await this.prisma.user.create({
        data: {
          email: 'employee@dexa.com',
          password: await bcrypt.hash(process.env.DEFAULT_EMPLOYEE_PASSWORD || 'employee123', 10),
          name: 'Budi (Karyawan)',
          role: 'EMPLOYEE',
          attendanceType: 'MULTI', // Seed as Multi-Shift for testing
        }
      });
    }
  }

  async login(loginDto: any) {
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoUrl: user.photoUrl,
        attendanceType: user.attendanceType,
      }
    };
  }
}
