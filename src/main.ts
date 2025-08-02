import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import config from 'config';

import { AppModule } from './app.module';
import { ServerConfig } from './config/interfaces/server-config.interface';

const server: ServerConfig = config.get('server');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');

  const config = new DocumentBuilder()
    .setTitle('Nestjs API Template')
    .setDescription('The Nestjs API Template description')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || server.port;
  const origin = process.env.ORIGIN || server.origin;

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors({ origin });
  await app.listen(port);
}
bootstrap();
