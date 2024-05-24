import { createParamDecorator } from '@nestjs/common';

import { User } from './entity/user.entity';

export const GetUser = createParamDecorator((data, { args: [argsElement] }): User => {
  return argsElement.user;
});
