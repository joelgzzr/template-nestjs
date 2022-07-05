import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { mockCredentials, mockForgotPassword, mockResetPassword, mockUser, mockUserEntity } from './utils/test.utils';

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
            forgotPassword: jest.fn(() => true),
            resetPassword: jest.fn(() => true),
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
      expect(authService.signIn).toHaveBeenCalledWith({ email, password });
    });
  });

  describe('signIn', () => {
    it('calls authService.signIn() correctly', async () => {
      await authController.signIn(mockCredentials);
      expect(authService.signIn).toHaveBeenCalledWith(mockCredentials);
    });
  });

  describe('forgotPassword', () => {
    it('calls authService.forgotPassword() correctly', async () => {
      await authController.forgotPassword(mockForgotPassword);
      expect(authService.forgotPassword).toHaveBeenCalledWith(mockForgotPassword);
    });
  });

  describe('resetPassword', () => {
    it('calls authService.resetPassword() correctly', async () => {
      await authController.resetPassword(mockResetPassword);
      expect(authService.resetPassword).toHaveBeenCalledWith(mockResetPassword);
    });
  });

  describe('me', () => {
    it('calls authService.me() correctly', () => {
      authController.me(mockUserEntity);
      expect(authService.me).toHaveBeenCalledWith(mockUserEntity);
    });
  });
});
