import { IsString, Matches, IsOptional } from 'class-validator';

export class AttendanceDto {
  @IsString({ message: 'Lokasi harus berupa teks koordinat' })
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, {
    message: 'Format lokasi tidak valid. Harus berupa "latitude,longitude" tanpa spasi (misal: -6.200000,106.816666)',
  })
  location?: string;
}
