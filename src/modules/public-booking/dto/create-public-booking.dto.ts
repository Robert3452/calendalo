import { IsDateString, IsEmail, IsString } from 'class-validator';

export class CreatePublicBookingDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  //   @IsOptional()
  @IsEmail()
  guestEmail!: string;

  //   @IsOptional()
  @IsString()
  guestName!: string;
}
