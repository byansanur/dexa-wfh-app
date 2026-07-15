import { Controller, Put, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmployeeService } from './employee.service';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Put('profile')
  @UseInterceptors(FileInterceptor('photo'))
  async updateProfile(
    @Body() body: { userId?: string; phone: string; photoUrl: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = body.userId || '123e4567-e89b-12d3-a456-426614174000';
    return this.employeeService.updateProfile(userId, {
      phone: body.phone,
      photoUrl: body.photoUrl,
    }, file);
  }
}
