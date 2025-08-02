import { createParamDecorator } from '@nestjs/common';

import { User } from './entities/user.entity';

export const GetUser = createParamDecorator((data, context): User => {
  return context.getArgs()[0].user;
});
