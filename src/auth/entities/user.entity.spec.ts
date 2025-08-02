import bcrypt from 'bcryptjs';

import { User } from './user.entity';

describe('User entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
    user.salt = 'testSalt';
    user.password = 'testPassword';
    (bcrypt.hash as jest.Mock) = jest.fn();
  });

  describe('validatePassword', () => {
    it('bcrypt.hash is called correctly', async () => {
      await user.validatePassword('1234567');
      expect(bcrypt.hash).toHaveBeenCalledWith('1234567', 'testSalt');
    });

    it('returns true if password is valid', async () => {
      (bcrypt.hash as jest.Mock).mockReturnValue('testPassword');

      const result = await user.validatePassword('1234567');
      expect(result).toEqual(true);
    });

    it('returns false if password is invalid', async () => {
      (bcrypt.hash as jest.Mock).mockReturnValue('wrongPassword');

      const result = await user.validatePassword('1234567');
      expect(result).toEqual(false);
    });
  });
});
