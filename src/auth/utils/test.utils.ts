import { AuthForgotPasswordDto } from '../dto/auth-forgot-password.dto';
import { AuthResetPasswordDto } from '../dto/auth-reset-password.dto';
import { AuthSignInDto } from '../dto/auth-signin.dto';
import { AuthSignUpDto } from '../dto/auth-signup.dto';
import { User } from '../user.entity';

export const mockUser: AuthSignUpDto = {
  name: 'Test Name',
  email: 'test@test.com',
  address: 'Test address 100',
  phone: '8372645339',
  password: 'test1234',
};

export const mockCredentials: AuthSignInDto = {
  email: 'test@test.com',
  password: 'test1234',
};

export const mockResetPassword: AuthResetPasswordDto = {
  resetToken: '1234567890',
  password: 'testPass',
};

export const mockForgotPassword: AuthForgotPasswordDto = {
  email: 'test@test.com',
};

export const mockUserEntity: User = new User();
mockUserEntity.name = 'Test Name';
mockUserEntity.email = 'test@test.com';
mockUserEntity.password = 'test1234';
mockUserEntity.salt = 'salt123';

export const mockUserEntityDeleted: User = new User();
mockUserEntityDeleted.name = 'Test Name';
mockUserEntityDeleted.email = 'test@test.com';
mockUserEntityDeleted.password = 'test1234';
mockUserEntityDeleted.salt = 'salt123';
delete mockUserEntityDeleted.password;
delete mockUserEntityDeleted.salt;
