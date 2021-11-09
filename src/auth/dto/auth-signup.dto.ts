import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class AuthSignUpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
