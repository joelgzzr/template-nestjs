import { NestFactory } from '@nestjs/core';
import * as config from 'config';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ServerConfig } from './config/interfaces/server-config.interface';

async function bootstrap() {
  const server: ServerConfig = config.get('server');
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || server.port;
  const origin = process.env.ORIGIN || server.origin;
  app.enableCors({ origin, credentials: true });
  app.use(cookieParser());
  await app.listen(port);
}
bootstrap();
