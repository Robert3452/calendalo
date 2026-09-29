import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class AiCreateBookingDto {
  @IsDateString()
  startTime!: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestName?: string;
}
