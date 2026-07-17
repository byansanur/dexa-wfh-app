import { IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateEmployeeDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Nama harus berupa teks' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsString()
  @IsOptional()
  password?: string;

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
