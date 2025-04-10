import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Translation, FileInfo, TranslationHistory, Log, ExamplePreset } from './entities';

@Injectable()
export class TypeOrmService implements OnModuleInit, OnModuleDestroy {
  // 각 엔티티에 대한 리포지토리
  public translation: Repository<Translation>;
  public fileInfo: Repository<FileInfo>;
  public translationHistory: Repository<TranslationHistory>;
  public log: Repository<Log>;
  public examplePreset: Repository<ExamplePreset>;

  constructor(@InjectDataSource() private dataSource: DataSource) {
    // 리포지토리 초기화
    this.translation = this.dataSource.getRepository(Translation);
    this.fileInfo = this.dataSource.getRepository(FileInfo);
    this.translationHistory = this.dataSource.getRepository(TranslationHistory);
    this.log = this.dataSource.getRepository(Log);
    this.examplePreset = this.dataSource.getRepository(ExamplePreset);
  }

  async onModuleInit() {
    console.log('TypeORM 데이터베이스에 연결되었습니다.');
  }

  async onModuleDestroy() {
    await this.dataSource.destroy();
    console.log('TypeORM 데이터베이스 연결이 종료되었습니다.');
  }

  // DataSource를 직접 사용할 수 있도록 getter 제공
  getDataSource(): DataSource {
    return this.dataSource;
  }
}
