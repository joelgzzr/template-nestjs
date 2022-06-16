import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: getRepositoryToken(User),
          useFactory: () => ({
            findOne: jest.fn(() => true),
          }),
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('validate', () => {
    it('findOne is called correctly ', async () => {
      await jwtStrategy.validate({ email: 'test@test.com' });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@test.com' } });
    });

    it('validates and returns user', async () => {
      const user = new User();
      user.email = 'test@test.com';

      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(user));

      const result = await jwtStrategy.validate({ email: 'test@test.com' });
      expect(result).toEqual(user);
    });

    it('throws unauthorized exception if user is not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(() => Promise.resolve(null));

      await expect(jwtStrategy.validate({ email: 'test@test.com' })).rejects.toThrow(UnauthorizedException);
    });
  });
});
