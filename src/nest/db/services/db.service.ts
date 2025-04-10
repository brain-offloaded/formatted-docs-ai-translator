import { Injectable } from '@nestjs/common';

import { getDbPath } from '../path';
@Injectable()
export class DbService {
  constructor() {}

  getDbPath() {
    return getDbPath();
  }
}
