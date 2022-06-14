import { NestFactory } from '@nestjs/core';
import * as config from 'config';

import { AppModule } from './app.module';
import { ServerConfig } from './config/interface/server-config.interface';

const server: ServerConfig = config.get('server');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || server.port;

  await app.listen(port);
}
bootstrap();
