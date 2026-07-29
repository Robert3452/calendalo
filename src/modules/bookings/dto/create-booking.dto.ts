import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestName?: string;
}
