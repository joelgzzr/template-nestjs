import { UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';

const mockUser: AuthSignUpDto = {
  name: 'Test Name',
  phone: '0000000',
  email: 'test@test.com',
  password: 'test1234',
};

const mockCredentials: AuthSignInDto = {
  email: 'test@test.com',
  password: 'test1234',
  rememberMe: false,
};

const mockUserEntity: User = new User();
mockUserEntity.name = 'Test Name';
mockUserEntity.phone = '0000000';
mockUserEntity.email = 'test@test.com';
mockUserEntity.password = 'test1234';
mockUserEntity.salt = 'salt123';

const mockUserEntityDeleted: User = new User();
mockUserEntityDeleted.name = 'Test Name';
mockUserEntityDeleted.phone = '0000000';
mockUserEntityDeleted.email = 'test@test.com';
mockUserEntityDeleted.password = 'test1234';
mockUserEntityDeleted.salt = 'salt123';
delete mockUserEntityDeleted.password;
delete mockUserEntityDeleted.salt;

describe('Auth Service', () => {
  let authService: AuthService;
  let userRepository: UserRepository;
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
          provide: UserRepository,
          useFactory: () => ({
            signUp: jest.fn(() => true),
            validateUserPassword: jest.fn().mockResolvedValue('test@test.com'),
          }),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('signUp', () => {
    it('userRepository.signUp() is not called initially', () => {
      expect(userRepository.signUp).not.toHaveBeenCalled();
    });

    it('calls userRepository.signUp() correctly', async () => {
      await authService.signUp(mockUser);
      expect(userRepository.signUp).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('signIn', () => {
    it('userRepository.validateUserPassword() is not called initially', () => {
      expect(userRepository.validateUserPassword).not.toHaveBeenCalled();
    });

    it('calls userRepository.validateUserPassword() correctly', async () => {
      await authService.signIn(mockCredentials);
      expect(userRepository.validateUserPassword).toHaveBeenCalledWith(mockCredentials);
    });

    it('throws error is userRepository.validateUserPassword() does not retrieve an email', async () => {
      jest.spyOn(userRepository, 'validateUserPassword').mockImplementation(() => null);

      await expect(authService.signIn(mockCredentials)).rejects.toThrow(UnauthorizedException);
    });

    it('calls jwtService.sign() if userRepository.validateUserPassword() retrieves an email', async () => {
      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'test@test.com');

      await authService.signIn(mockCredentials);
      expect(jwtService.sign).toHaveBeenCalledWith({ email: mockUser.email });
    });

    it('returns accessToken correctly', async () => {
      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'test@test.com');

      const { accessToken } = await authService.signIn(mockCredentials);
      expect(accessToken).toBe('test@test.com');
    });
  });

  describe('me', () => {
    it('returns user without password and salt', () => {
      expect(authService.me(mockUserEntity)).toStrictEqual(mockUserEntityDeleted);
    });
  });
});
