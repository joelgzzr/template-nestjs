import { randomBytes } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as SES from 'aws-sdk/clients/ses';
import { SendEmailResponse } from 'aws-sdk/clients/ses';
import * as config from 'config';

import { ServerConfig } from '../config/interfaces/server-config.interface';

import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

const server: ServerConfig = config.get('server');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async signUp(authSignUpDto: AuthSignUpDto): Promise<void> {
    return this.userRepository.signUp(authSignUpDto);
  }

  async signIn(authSignInDto: AuthSignInDto): Promise<{ accessToken: string; date: Date }> {
    const email = await this.userRepository.validateUserPassword(authSignInDto);

    if (!email) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload: JwtPayload = { email };
    const accessToken = this.jwtService.sign(payload);

    const auxDate = new Date();
    const year = auxDate.getFullYear();
    const month = auxDate.getMonth();
    const day = auxDate.getDate();
    const date = new Date(year + 1, month, day);

    return { accessToken, date };
  }

  async forgotPassword(authForgotPasswordDto: AuthForgotPasswordDto): Promise<SendEmailResponse> {
    const { email } = authForgotPasswordDto;
    const user = await this.userRepository.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('El email no está asociado a una cuenta');
    }

    const resetToken: string = randomBytes(20).toString('hex');
    const auxDate = new Date();
    const resetTokenExpiration: Date = new Date(auxDate.getTime() + 15 * 60000);

    await this.userRepository.insertResetToken(email, resetToken, resetTokenExpiration);

    return new SES({
      apiVersion: '2010-12-01',
      accessKeyId: process.env.EMAIL_AK,
      secretAccessKey: process.env.EMAIL_SK,
      region: 'us-east-2',
    })
      .sendEmail({
        Source: 'Email <email@gmail.com>',
        Destination: {
          ToAddresses: [`${user.name} <${email}>`],
        },
        Message: {
          Subject: {
            Data: 'Restablecer Contraseña',
          },
          Body: {
            Html: {
              Data: `
                <h2>Haga click en en el enlace para restablecer contraseña</h2>
                <a href="${process.env.ORIGIN || server.origin}/reset-password/${resetToken}">Enlace</a>
              `,
            },
          },
        },
      })
      .promise();
  }

  async resetPassword(authResetPasswordDto: AuthResetPasswordDto): Promise<void> {
    return this.userRepository.resetPassword(authResetPasswordDto);
  }

  me(user: User): User {
    delete user.password;
    delete user.salt;

    return user;
  }
}
