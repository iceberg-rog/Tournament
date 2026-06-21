import { IsEmail, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  /** کد TOTP در صورت فعال‌بودن احراز هویت دومرحله‌ای. */
  @IsOptional()
  @IsString()
  code?: string;
}
