import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';

import { DbConfig } from './interface/db-config.interface';

const db: DbConfig = config.get('db');

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: db.type,
  host: process.env.DB_HOST || db.host,
  port: (process.env.DB_PORT as any) || db.port,
  username: process.env.DB_USERNAME || db.username,
  password: process.env.DB_PASSWORD || db.password,
  database: process.env.DB_DATABASE || db.database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: (process.env.DB_SYNC as any) || db.synchronize,
};
