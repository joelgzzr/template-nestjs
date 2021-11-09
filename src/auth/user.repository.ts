import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Repository, EntityRepository } from 'typeorm';

import { AuthResetPasswordDto } from './dto/auth-reset-password.dto';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { User } from './user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  async signUp(authSignUpDto: AuthSignUpDto): Promise<void> {
    const { name, phone, email, password } = authSignUpDto;

    const user = this.create();
    user.name = name;
    user.phone = phone;
    user.email = email;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (e) {
      if (e.errno === 1062) {
        throw new ConflictException('El email ya está asociado a una cuenta');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async validateUserPassword(authSignInDto: AuthSignInDto): Promise<string> {
    const { email, password } = authSignInDto;
    const user = await this.findOne({ email });

    if (user && (await user.validatePassword(password))) {
      return user.email;
    }

    return null;
  }

  async insertResetToken(email: string, resetToken: string, resetTokenExpiration: Date): Promise<void> {
    const user = await this.findOne({ email });
    user.resetToken = resetToken;
    user.resetTokenExpiration = resetTokenExpiration;

    try {
      await user.save();
    } catch (e) {
      throw new InternalServerErrorException('Error inserting token');
    }
  }

  async resetPassword(authResetPasswordDto: AuthResetPasswordDto): Promise<void> {
    const { resetToken, password } = authResetPasswordDto;
    const user = await this.findOne({ resetToken });

    if (!user || new Date() > user.resetTokenExpiration) {
      throw new ConflictException('Error al cambiar contraseña');
    }

    user.resetToken = '';
    user.resetTokenExpiration = null;
    user.salt = await bcrypt.genSalt();
    user.password = await this.hashPassword(password, user.salt);

    try {
      await user.save();
    } catch (e) {
      if (e.errno === 1062) {
        throw new ConflictException('Error al actualizar la contraseña');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
