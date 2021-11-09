import { IsNotEmpty, IsString } from 'class-validator';

export class AuthResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
