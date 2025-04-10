import { DataSource } from 'typeorm';

import { getDataSourceOptions } from './get-options';

// 마이그레이션 실행 및 스키마 관리를 위한 DataSource
export const AppDataSource = new DataSource(getDataSourceOptions());
