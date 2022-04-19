import { Controller, Body, Post, ValidationPipe, Res, Get, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SendEmailResponse } from 'aws-sdk/clients/ses';
import * as config from 'config';
import { Response } from 'express';

import { CookiesConfig } from '../config/interface/cookies-config.interface';

import { AuthService } from './auth.service';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { GetUser } from './get-user.decorator';
import { User } from './user.entity';

const cookies: CookiesConfig = config.get('cookies');

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body(ValidationPipe) authSignUpDto: AuthSignUpDto, @Res() response: Response): Promise<Response> {
    const { email, password } = authSignUpDto;
    await this.authService.signUp(authSignUpDto);
    const { accessToken, date } = await this.authService.signIn({ email, password, rememberMe: true });
    response.cookie('token', accessToken, {
      httpOnly: false,
      domain: process.env.DOMAIN || cookies.domain,
      secure: (process.env.SECURE as any) || cookies.secure,
      path: '/',
      expires: date,
    });
    return response.send('Signed Up. Cookie Set.');
  }

  @Post('/signin')
  async signIn(@Body(ValidationPipe) authSignInDto: AuthSignInDto, @Res() response: Response): Promise<Response> {
    const { accessToken, date } = await this.authService.signIn(authSignInDto);
    response.cookie('token', accessToken, {
      httpOnly: false,
      domain: process.env.DOMAIN || cookies.domain,
      secure: (process.env.SECURE as any) || cookies.secure,
      path: '/',
      expires: authSignInDto.rememberMe === true ? date : null,
    });
    return response.send('Signed In. Cookie Set.');
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
