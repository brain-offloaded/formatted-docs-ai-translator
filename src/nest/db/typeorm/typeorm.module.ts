import { Module } from '@nestjs/common';
import { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';

import {
  Translation,
  FileInfo,
  TranslationHistory,
  Log,
  ExamplePreset,
  PromptPreset,
} from './entities'; // PromptPreset 추가
import { getNestTypeOrmOptions } from './get-options';
import { TypeOrmService } from './typeorm.service';

@Module({
  imports: [
    NestTypeOrmModule.forRootAsync({
      useFactory: () => {
        // WAL 모드 및 SQLite 최적화 설정
        return getNestTypeOrmOptions();
      },
    }),
    NestTypeOrmModule.forFeature([
      Translation,
      FileInfo,
      TranslationHistory,
      Log,
      ExamplePreset,
      PromptPreset, // PromptPreset 추가
    ]),
  ],
  providers: [TypeOrmService],
  exports: [TypeOrmService, NestTypeOrmModule],
})
export class TypeOrmDbModule {}
