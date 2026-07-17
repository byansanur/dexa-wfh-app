// Standalone DTO without mapped-types dependency
// Actually let's just make it standalone so we don't need mapped-types.
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateEmployeeDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Nama harus berupa teks' })
  @IsOptional()
  name?: string;

  @IsEnum(['ADMIN', 'EMPLOYEE'], { message: 'Role harus ADMIN atau EMPLOYEE' })
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['SINGLE', 'MULTI'], { message: 'Tipe absensi harus SINGLE atau MULTI' })
  @IsOptional()
  attendanceType?: string;
}
