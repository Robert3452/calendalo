import { IsEmail, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  accountName!: string;

  @IsString()
  password!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  timezone!: string;
}
