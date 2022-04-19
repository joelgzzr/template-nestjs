import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import * as httpMocks from 'node-mocks-http';

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

const mockResponse: Response = httpMocks.createResponse();

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
      await authController.signUp(mockUser, mockResponse);
      expect(authService.signUp).toHaveBeenCalledWith(mockUser);
    });

    it('calls authService.signIn() correctly', async () => {
      const { email, password } = mockUser;
      await authController.signUp(mockUser, mockResponse);
      expect(authService.signIn).toHaveBeenCalledWith({ email, password, rememberMe: true });
    });

    it('calls response.cookie() correctly', async () => {
      jest.spyOn(mockResponse, 'cookie').mockImplementation();
      jest
        .spyOn(authService, 'signIn')
        .mockImplementation(() => Promise.resolve({ accessToken: 'testToken', date: new Date(1997, 12, 16) }));

      await authController.signUp(mockUser, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'testToken', {
        httpOnly: false,
        domain: 'localhost',
        secure: false,
        path: '/',
        expires: new Date(1997, 12, 16),
      });
    });

    it('calls response.send() correctly', async () => {
      jest.spyOn(mockResponse, 'send').mockImplementation();

      await authController.signUp(mockUser, mockResponse);
      expect(mockResponse.send).toHaveBeenCalledWith('Signed Up. Cookie Set.');
    });
  });

  describe('signIn', () => {
    it('calls authService.signIn() correctly', async () => {
      await authController.signIn(mockCredentials, mockResponse);
      expect(authService.signIn).toHaveBeenCalledWith(mockCredentials);
    });

    it('calls response.cookie() correctly', async () => {
      jest.spyOn(mockResponse, 'cookie').mockImplementation();
      jest
        .spyOn(authService, 'signIn')
        .mockImplementation(() => Promise.resolve({ accessToken: 'testToken', date: new Date(1997, 12, 16) }));

      await authController.signIn(mockCredentials, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith('token', 'testToken', {
        httpOnly: false,
        domain: 'localhost',
        secure: false,
        path: '/',
        expires: null,
      });
    });

    it('calls response.send() correctly', async () => {
      jest.spyOn(mockResponse, 'send').mockImplementation();

      await authController.signIn(mockCredentials, mockResponse);
      expect(mockResponse.send).toHaveBeenCalledWith('Signed Up. Cookie Set.');
    });
  });

  describe('me', () => {
    it('calls authService.me() correctly', () => {
      authController.me(mockUserEntity);
      expect(authService.me).toHaveBeenCalledWith(mockUserEntity);
    });
  });
});
