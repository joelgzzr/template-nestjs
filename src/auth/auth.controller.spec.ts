import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSignInDto } from './dto/auth-signin.dto';
import { AuthSignUpDto } from './dto/auth-signup.dto';
import { User } from './user.entity';

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

describe('Auth Controller', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      providers: [
        {
          provide: AuthService,
          useFactory: () => ({
            signUp: jest.fn(() => true),
            signIn: jest.fn(() => true),
            me: jest.fn(() => true),
          }),
        },
      ],
      controllers: [AuthController],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    authController = module.get<AuthController>(AuthController);
  });

  describe('signUp', () => {
    it('calls authService.signUp() correctly', async () => {
      await authController.signUp(mockUser);
      expect(authService.signUp).toHaveBeenCalledWith(mockUser);
    });

    it('calls authService.signIn() correctly', async () => {
      const { email, password } = mockUser;
      await authController.signUp(mockUser);
      expect(authService.signIn).toHaveBeenCalledWith({ email, password, rememberMe: true });
    });
  });

  describe('signIn', () => {
    it('calls authService.signIn() correctly', async () => {
      await authController.signIn(mockCredentials);
      expect(authService.signIn).toHaveBeenCalledWith(mockCredentials);
    });
  });

  describe('me', () => {
    it('calls authService.me() correctly', () => {
      authController.me(mockUserEntity);
      expect(authService.me).toHaveBeenCalledWith(mockUserEntity);
    });
  });
});
