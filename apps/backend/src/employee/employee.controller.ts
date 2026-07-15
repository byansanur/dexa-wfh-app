import { Controller, Put, Body } from '@nestjs/common';
import { EmployeeService } from './employee.service';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Put('profile')
  async updateProfile(@Body() body: { userId?: string; phone: string; photoUrl: string }) {
    // For MVP, if no userId is provided, we simulate a default user ID
    // In a real app, this comes from JWT / Req User
    const userId = body.userId || '123e4567-e89b-12d3-a456-426614174000';
    return this.employeeService.updateProfile(userId, {
      phone: body.phone,
      photoUrl: body.photoUrl,
    });
  }
}
