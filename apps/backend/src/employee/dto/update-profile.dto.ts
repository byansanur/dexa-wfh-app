import { IsString, IsOptional, Matches, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'Nomor HP harus berupa teks' })
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, { message: 'Nomor HP harus berupa angka dengan panjang 10 hingga 15 karakter.' })
  phone?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Kata sandi lama minimal 6 karakter' })
  currentPassword?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Kata sandi baru minimal 6 karakter' })
  newPassword?: string;
}
