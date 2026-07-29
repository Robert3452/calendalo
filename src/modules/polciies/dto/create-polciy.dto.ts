import { IsInt } from 'class-validator';

export class UpsertPolciyDto {
  @IsInt()
  minNoticeHours!: number;

  @IsInt()
  cancelLimitHours!: number;

  @IsInt()
  slotDurationMin!: number;
}
