import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as config from 'config';

import { AppModule } from './app.module';
import { ServerConfig } from './config/interface/server-config.interface';

const server: ServerConfig = config.get('server');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  app.enableCors({ origin });
  await app.listen(port);
}
bootstrap();
