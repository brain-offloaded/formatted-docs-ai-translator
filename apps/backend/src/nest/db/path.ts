import path from 'path';

import { app } from 'electron';

export const isProduction = process.env.NODE_ENV === 'production';

export const getCurrentPath = () => {
  switch (process.env.NODE_ENV?.toLowerCase()) {
    case 'production':
      return path.join(app.getPath('userData'), 'production');
    default:
      return path.resolve('.');
  }
};

const getDbName = () => {
  switch (process.env.NODE_ENV?.toLowerCase()) {
    case 'test':
      return 'translation-cache-test.db';
    default:
      return 'translation-cache.db';
  }
};

export const getDbPath = () => {
  const dbName = getDbName();
  const pathName = getCurrentPath();
  return path.join(pathName, dbName);
};

export const getTempDirectory = () => {
  return path.join(getCurrentPath(), 'temp');
};
