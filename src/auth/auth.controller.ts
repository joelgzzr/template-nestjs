import { Controller, Body, Post, ValidationPipe, Get, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SendEmailResponse } from 'aws-sdk/clients/ses';

import { AuthService } from './auth.service';
import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { GetUser } from './get-user.decorator';
import { TokenResponse } from './response/token.response';
import { UserResponse } from './response/user.response';
import { User } from './user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: 'Sign up a User', tags: ['auth'] })
  @ApiResponse({ status: 201, description: 'Created', type: TokenResponse })
  async signUp(@Body(ValidationPipe) authSignUpDto: AuthSignUpDto): Promise<TokenResponse> {
    const { email, password } = authSignUpDto;
    await this.authService.signUp(authSignUpDto);
    return this.authService.signIn({ email, password });
  }

  @Post('/signin')
  @ApiOperation({ summary: 'Sign in a User', tags: ['auth'] })
  @ApiResponse({ status: 201, description: 'Created', type: TokenResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signIn(@Body(ValidationPipe) authSignInDto: AuthSignInDto): Promise<TokenResponse> {
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get User info', tags: ['auth'] })
  @ApiResponse({ status: 201, description: 'OK', type: UserResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  me(@GetUser() user: User): UserResponse {
    return this.authService.me(user);
  }
}
