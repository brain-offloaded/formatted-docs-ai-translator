import path from 'path';

import { app } from 'electron';

export const isProduction = process.env.NODE_ENV === 'production';

export const getDbPath = () => {
  switch (process.env.NODE_ENV?.toLowerCase()) {
    case 'test':
      return path.resolve('translation-cache-test.db');
    case 'development':
      return path.resolve('translation-cache.db');
    case 'production':
      return path.join(app.getPath('userData'), 'translation-cache.db');
    default:
      return path.resolve('translation-cache.db');
  }
};
