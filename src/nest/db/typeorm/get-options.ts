import * as path from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BetterSqlite3ConnectionOptions } from 'typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions';

import { isProduction, getDbPath } from '../path';

export const getDataSourceOptions = (): BetterSqlite3ConnectionOptions => {
  const dbPath = getDbPath();
  const entitiesPath = path.join(__dirname, 'entities', '*.{ts,js}');
  const migrationsPath = path.join(__dirname, 'migrations', '*.{ts,js}');

  return {
    type: 'better-sqlite3',
    database: dbPath,
    entities: [entitiesPath],
    migrations: [migrationsPath],
    synchronize: false, // !isProduction,
    logging: !isProduction ? ['error', 'warn'] : false,
    migrationsRun: true, // isProduction,
    entitySkipConstructor: false,
    extra: {
      pragma: {
        journal_mode: 'WAL',
        synchronous: 'NORMAL',
        cache_size: -1000 * 64,
        foreign_keys: 'ON',
        temp_store: 'MEMORY',
      },
      poolSize: 10,
    },
  };
};

export const getNestTypeOrmOptions = (): TypeOrmModuleOptions => {
  return {
    ...getDataSourceOptions(),
  };
};
