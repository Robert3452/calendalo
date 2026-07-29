import { IsDateString, IsString } from 'class-validator';

export class CreateBlockDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsString()
  reason!: string;
}
