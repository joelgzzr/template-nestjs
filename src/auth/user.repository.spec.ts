import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

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

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('signUp', () => {
    let save;

    beforeEach(() => {
      save = jest.fn();
      userRepository.create = jest.fn().mockReturnValue({ save });
    });

    it('signs up the user correctly', async () => {
      save.mockResolvedValue(undefined);
      await expect(userRepository.signUp(mockUser)).resolves.not.toThrow();
    });

    it('throws conflict exception if user exists', async () => {
      save.mockRejectedValue({ errno: 1062 });
      await expect(userRepository.signUp(mockUser)).rejects.toThrow(ConflictException);
    });

    it('throws internal server error if save fails', async () => {
      save.mockRejectedValue({ errno: 10062 });
      await expect(userRepository.signUp(mockUser)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('validateUserPassword', () => {
    let user: User;

    beforeEach(() => {
      user = new User();
      user.email = 'TestUsername';
    });

    it('returns username successfully', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'validatePassword').mockImplementation(() => Promise.resolve(true));

      const result = await userRepository.validateUserPassword(mockCredentials);
      expect(result).toEqual('TestUsername');
    });

    it('returns null if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(null));

      const result = await userRepository.validateUserPassword(mockCredentials);
      expect(result).toBeNull();
    });

    it('returns null if password is invalid', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));
      jest.spyOn(user, 'validatePassword').mockImplementation(() => Promise.resolve(false));

      const result = await userRepository.validateUserPassword(mockCredentials);
      expect(result).toBeNull();
    });
  });
});
