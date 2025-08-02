import { randomBytes } from 'crypto';

import { SESClient, SendEmailCommand, SendEmailResponse } from '@aws-sdk/client-ses';
import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import config from 'config';
import { Repository } from 'typeorm';

import { ServerConfig } from '../config/interfaces/server-config.interface';

import { AuthForgotPasswordDto } from './dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { User } from './entities/user.entity';
import { JwtPayload } from './jwt-payload.interface';

const server: ServerConfig = config.get('server');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(authSignUpDto: AuthSignUpDto): Promise<void> {
    const { name, email, address, phone, password } = authSignUpDto;

    const user = this.userRepository.create();
    user.name = name;
    user.email = email;
    user.address = address;
    user.phone = phone;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (e) {
      if (e.errno === 1062) {
        throw new ConflictException('Email already in use', HttpStatus.CONFLICT as unknown as string);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(authSignInDto: AuthSignInDto): Promise<{ accessToken: string; date: Date }> {
    const email = await this.validateUserPassword(authSignInDto);

    if (!email) {
      throw new UnauthorizedException('Unauthorized', HttpStatus.UNAUTHORIZED as unknown as string);
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
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Unauthorized', HttpStatus.UNAUTHORIZED as unknown as string);
    }

    const resetToken: string = randomBytes(20).toString('hex');
    const auxDate = new Date();
    const resetTokenExpiration: Date = new Date(auxDate.getTime() + 15 * 60000);

    await this.insertResetToken(email, resetToken, resetTokenExpiration);

    const sesClient = new SESClient({
      region: 'us-east-2',
      credentials: {
        accessKeyId: process.env.EMAIL_AK,
        secretAccessKey: process.env.EMAIL_SK,
      },
    });

    const sendEmailCommandInput = {
      Source: 'Email <email@gmail.com>', // Verified sender email address
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
    };

    const command = new SendEmailCommand(sendEmailCommandInput);

    try {
      const response = await sesClient.send(command);
      return response;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async resetPassword(authResetPasswordDto: AuthResetPasswordDto): Promise<void> {
    const { resetToken, password } = authResetPasswordDto;
    const user = await this.userRepository.findOne({ where: { resetToken } });

    if (!user || new Date() > user.resetTokenExpiration) {
      throw new UnauthorizedException('Unauthorized', HttpStatus.UNAUTHORIZED as unknown as string);
    }

    user.resetToken = '';
    user.resetTokenExpiration = null;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch {
      throw new InternalServerErrorException(
        'Error updating password',
        HttpStatus.INTERNAL_SERVER_ERROR as unknown as string,
      );
    }
  }

  async validateUserPassword(authSignInDto: AuthSignInDto): Promise<string> {
    const { email, password } = authSignInDto;
    const user = await this.userRepository.findOne({ where: { email } });

    if (user && (await user.validatePassword(password))) {
      return user.email;
    }

    return null;
  }

  async insertResetToken(email: string, resetToken: string, resetTokenExpiration: Date): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Unauthorized', HttpStatus.UNAUTHORIZED as unknown as string);
    }

    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;

    try {
      await user.save();
    } catch {
      throw new InternalServerErrorException(
        'Error creating token',
        HttpStatus.INTERNAL_SERVER_ERROR as unknown as string,
      );
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }

  me(user: User): User {
    delete user.password;
    delete user.salt;

    return user;
  }
}
