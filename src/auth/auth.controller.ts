import { Controller, Body, Post, ValidationPipe, Get, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SendEmailResponse } from 'aws-sdk/clients/ses';

import { AuthService } from './auth.service';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body(ValidationPipe) authSignUpDto: AuthSignUpDto): Promise<{ accessToken: string; date: Date }> {
    const { email, password } = authSignUpDto;
    await this.authService.signUp(authSignUpDto);
    return this.authService.signIn({ email, password, rememberMe: true });
  }

  @Post('/signin')
  async signIn(@Body(ValidationPipe) authSignInDto: AuthSignInDto): Promise<{ accessToken: string; date: Date }> {
    return await this.authService.signIn(authSignInDto);
  }

  @Put('/forgot-password')
  async forgotPassword(@Body(ValidationPipe) authForgotPasswordDto: AuthForgotPasswordDto): Promise<SendEmailResponse> {
    return this.authService.forgotPassword(authForgotPasswordDto);
  }

  @Put('/reset-password')
  async resetPassword(@Body(ValidationPipe) authResetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(authResetPasswordDto);
  }

  @UseGuards(AuthGuard())
  @Get('/me')
  me(@GetUser() user: User): User {
    return this.authService.me(user);
  }

  @Get('/test')
  test(): string {
    return 'Hello';
  }
}
