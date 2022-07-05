import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { User } from './user.entity';
import {
  mockCredentials,
  mockForgotPassword,
  mockResetPassword,
  mockUser,
  mockUserEntity,
  mockUserEntityDeleted,
} from './utils/test.utils';

jest.mock('aws-sdk/clients/ses', () => {
  const mSES = {
    sendEmail: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  };
  return jest.fn(() => mSES);
});

describe('Auth Service', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'testSecret',
          signOptions: {
            expiresIn: 3600,
          },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(),
          }),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signUp', () => {
    let save;

    beforeEach(() => {
      save = jest.fn();
      userRepository.create = jest.fn().mockReturnValue({ save });
    });

    it('signs up the user correctly', async () => {
      await expect(authService.signUp(mockUser)).resolves.not.toThrow();
    });

    it('throws conflict exception if user exists', async () => {
      save.mockRejectedValue({ errno: 1062 });
      await expect(authService.signUp(mockUser)).rejects.toThrow(ConflictException);
    });

    it('throws internal server error if save fails', async () => {
      save.mockRejectedValue({ errno: 10062 });
      await expect(authService.signUp(mockUser)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('signIn', () => {
    beforeEach(() => {
      authService.validateUserPassword = jest.fn().mockReturnValue(() => 'test@test.com');
    });

    it('calls authService.validateUserPassword() correctly', async () => {
      await authService.signIn(mockCredentials);
      expect(authService.validateUserPassword).toHaveBeenCalledWith(mockCredentials);
    });

    it('throws error if authService.validateUserPassword() does not retrieve an email', async () => {
      jest.spyOn(authService, 'validateUserPassword').mockImplementation(() => null);

      await expect(authService.signIn(mockCredentials)).rejects.toThrow(UnauthorizedException);
    });

    it('calls jwtService.sign() if userRepository.validateUserPassword() retrieves an email', async () => {
      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'test@test.com');
      jest.spyOn(authService, 'validateUserPassword').mockImplementation(() => Promise.resolve('test@test.com'));

      await authService.signIn(mockCredentials);
      expect(jwtService.sign).toHaveBeenCalledWith({ email: mockUser.email });
    });

    it('returns accessToken correctly', async () => {
      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'test@test.com');

      const { accessToken } = await authService.signIn(mockCredentials);
      expect(accessToken).toBe('test@test.com');
    });
  });

  describe('forgotPassword', () => {
    const user: User = new User();

    beforeEach(() => {
      authService.insertResetToken = jest.fn().mockResolvedValue({});
      user.email = 'test@test.com';
    });

    it('calls userRepository.findOne() correctly', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));

      await authService.forgotPassword(mockForgotPassword);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('calls userRepository.findOne() correctly', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));

      await authService.forgotPassword(mockForgotPassword);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('throws unauthorized if userRepository.findOne() does not return a user', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(null));

      expect(authService.forgotPassword(mockForgotPassword)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    const user: User = new User();
    const today: Date = new Date();
    const yesterday: Date = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow: Date = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    beforeEach(() => {
      user.email = 'test@test.com';
      user.save = jest.fn();
      user.resetTokenExpiration = tomorrow;
    });

    it('userRepository.findOne() is called correctly', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));

      await authService.resetPassword(mockResetPassword);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { resetToken: '1234567890' } });
    });

    it('throws unauthorized if userRepository.findOne() does not return a user', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(null));

      await expect(authService.resetPassword(mockResetPassword)).rejects.toThrow(UnauthorizedException);
    });

    it('throws unauthorized if user token is expired', async () => {
      user.resetTokenExpiration = yesterday;
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));

      await expect(authService.resetPassword(mockResetPassword)).rejects.toThrow(UnauthorizedException);
    });

    it('throws internal server error if save fails', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'save').mockRejectedValue({ errno: 10064 });

      await expect(authService.resetPassword(mockResetPassword)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('validateUserPassword', () => {
    const user: User = new User();

    beforeEach(() => {
      user.email = 'test@test.com';
    });

    it('returns username successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'validatePassword').mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUserPassword(mockCredentials);
      expect(result).toEqual('test@test.com');
    });

    it('returns null if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(null));

      const result = await authService.validateUserPassword(mockCredentials);
      expect(result).toBeNull();
    });

    it('returns null if password is invalid', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'validatePassword').mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUserPassword(mockCredentials);
      expect(result).toBeNull();
    });
  });

  describe('insertResetToken', () => {
    const user: User = new User();

    beforeEach(() => {
      user.email = 'test@test.com';
      user.save = jest.fn();
    });

    it('userRepository.findOne() is called correctly', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));

      await authService.insertResetToken('test@test.com', 'testToken', new Date());
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('throws unuthorized if userRepository.findOne() does not return a user', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(null));

      await expect(authService.insertResetToken('test@test.com', 'testToken', new Date())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws internal server error if save fails', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'save').mockRejectedValue({ errno: 10064 });

      await expect(authService.insertResetToken('test@test.com', 'testToken', new Date())).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('throws internal server error if save fails', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'save').mockRejectedValue({ errno: 10064 });

      await expect(authService.insertResetToken('test@test.com', 'testToken', new Date())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('me', () => {
    it('returns user without password and salt', () => {
      expect(authService.me(mockUserEntity)).toStrictEqual(mockUserEntityDeleted);
    });
  });
});
