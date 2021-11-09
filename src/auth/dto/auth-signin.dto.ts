import { IsString, IsEmail, IsBoolean } from 'class-validator';

export class AuthSignInDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsBoolean()
  rememberMe: boolean;
}
