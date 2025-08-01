import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { In } from 'typeorm';

import { errorToString } from '../../../../utils/error-stringify';
import { Translation, FileInfo, TranslationHistory } from '../../../db/typeorm/entities';
import { TypeOrmService } from '../../../db/typeorm/typeorm.service';
import { LoggerService } from '../../../logger/logger.service';
import { FilePathInfo, TranslationData, TranslationHistoryData } from '@/types/cache';

@Injectable()
export class TranslationLoaderService {
  // 기본 번역 로더
  private sourceLoader: DataLoader<string, TranslationData | null>;
  private idLoader: DataLoader<number, TranslationData | null>;

  // 번역 이력 로더
  private historyLoader: DataLoader<number, TranslationHistoryData[]>;
  private sourceHistoryLoader: DataLoader<string, TranslationHistoryData[]>;

  constructor(
    private readonly orm: TypeOrmService,
    private readonly logger: LoggerService
  ) {
    // 소스 텍스트로 번역을 조회하는 DataLoader
    this.sourceLoader = new DataLoader<string, TranslationData | null>(
      async (keys) => {
        try {
          const translations = await this.orm.translation.find({
            where: {
              source: In(keys as string[]),
            },
            relations: {
              fileInfo: true,
            },
          });

          // 키별로 번역 매핑
          const translationMap = new Map(translations.map((t) => [t.source, t]));

          // 모든 키에 대해 결과 반환 (없는 경우 null)
          return keys.map((key) => translationMap.get(key) || null);
        } catch (error) {
          this.logger.error('배치 번역 조회 중 오류:', { error });
          return keys.map(() => null);
        }
      },
      {
        maxBatchSize: 100,
        cache: true,
        cacheMap: new Map(),
      }
    );

    // ID로 번역을 조회하는 DataLoader
    this.idLoader = new DataLoader<number, TranslationData | null>(
      async (ids) => {
        try {
          const translations = await this.orm.translation.find({
            where: {
              id: In(ids as number[]),
            },
            relations: {
              fileInfo: true,
            },
          });

          // ID별로 번역 매핑
          const translationMap = new Map(translations.map((t) => [t.id, t]));

          // 모든 ID에 대해 결과 반환 (없는 경우 null)
          return ids.map((id) => translationMap.get(id) || null);
        } catch (error) {
          this.logger.error('ID로 번역 배치 조회 중 오류:', { error });
          return ids.map(() => null);
        }
      },
      {
        maxBatchSize: 100,
        cache: true,
        cacheMap: new Map(),
      }
    );

    // 번역 ID로 이력을 조회하는 DataLoader
    this.historyLoader = new DataLoader<number, TranslationHistoryData[]>(
      async (translationIds) => {
        try {
          const histories = await this.orm.translationHistory.find({
            where: {
              translation: {
                id: In(translationIds as number[]),
              },
            },
            relations: {
              translation: true,
            },
            order: {
              createdAt: 'DESC',
            },
          });

          // ID별로 이력 그룹화
          const historyMap = new Map<number, TranslationHistoryData[]>();
          histories.forEach((history) => {
            const existing = historyMap.get(history.translation.id) || [];
            historyMap.set(history.translation.id, [
              ...existing,
              {
                id: history.id,
                translationId: history.translation.id,
                source: history.source,
                target: history.target,
                success: history.success,
                error: history.error,
                model: history.model,
                createdAt: history.createdAt,
              },
            ]);
          });

          // 모든 ID에 대해 결과 반환 (없는 경우 빈 배열)
          return translationIds.map((id) => historyMap.get(id) || []);
        } catch (error) {
          this.logger.error('번역 이력 배치 조회 중 오류:', { error });
          return translationIds.map(() => []);
        }
      },
      {
        maxBatchSize: 100,
        cache: true,
        cacheMap: new Map(),
      }
    );

    // 소스 텍스트로 이력을 조회하는 DataLoader
    this.sourceHistoryLoader = new DataLoader<string, TranslationHistoryData[]>(async (sources) => {
      try {
        const translations = await this.orm.translation.find({
          where: { source: In(sources as string[]) },
          select: ['id', 'source'],
        });

        if (translations.length === 0) {
          return sources.map(() => []);
        }

        // 찾은 번역들의 ID 추출
        const translationIds = translations.map((t) => t.id);

        // 번역 ID들로 이력 조회
        const histories = await this.orm.translationHistory.find({
          where: { translation: { id: In(translationIds) } },
          relations: ['translation'],
          order: { createdAt: 'DESC' },
        });

        // 소스별로 이력을 그룹화
        const historiesBySource = new Map<string, TranslationHistoryData[]>();

        // 먼저 결과를 초기화
        for (const source of sources) {
          historiesBySource.set(source, []);
        }

        // 번역 ID를 소스와 매핑
        const idToSourceMap = new Map<number, string>();
        for (const translation of translations) {
          idToSourceMap.set(translation.id, translation.source);
        }

        // 이력을 소스별로 그룹화
        for (const history of histories) {
          const translationId = history.translation.id;
          const source = idToSourceMap.get(translationId);

          if (source) {
            const currentHistories = historiesBySource.get(source) || [];
            currentHistories.push({
              ...history,
              translationId: translationId, // translationId 필드를 호환성을 위해 추가
            });
            historiesBySource.set(source, currentHistories);
          }
        }

        // 요청된 소스 순서대로 결과 반환
        return sources.map((source) => historiesBySource.get(source) || []);
      } catch (error) {
        this.logger.error(
          `Error loading translation histories by source: ${(error as Error).message}`,
          {
            error: errorToString(error),
          }
        );
        return sources.map(() => []);
      }
    });
  }

  /**
   * 소스 텍스트로 번역을 로드합니다.
   * DataLoader가 자동으로 배치 처리하고 캐시합니다.
   */
  public async loadBySource(source: string): Promise<TranslationData | null> {
    try {
      return await this.sourceLoader.load(source);
    } catch (error) {
      this.logger.error(`번역 로드 중 오류: ${error}`, { source });
      return null;
    }
  }

  /**
   * 여러 소스 텍스트로 번역을 로드합니다.
   */
  public async loadManyBySource(sources: string[]): Promise<Map<string, TranslationData | null>> {
    try {
      const results = await this.sourceLoader.loadMany(sources);
      const resultMap = new Map<string, TranslationData | null>();

      sources.forEach((source, index) => {
        const result = results[index];
        resultMap.set(source, result instanceof Error ? null : result);
      });

      return resultMap;
    } catch (error) {
      this.logger.error(`다중 번역 로드 중 오류: ${error}`);
      return new Map(sources.map((source) => [source, null]));
    }
  }

  /**
   * ID로 번역을 로드합니다.
   */
  public async loadById(id: number): Promise<TranslationData | null> {
    try {
      return await this.idLoader.load(id);
    } catch (error) {
      this.logger.error(`ID로 번역 로드 중 오류: ${error}`, { id });
      return null;
    }
  }

  /**
   * 여러 ID로 번역을 로드합니다.
   */
  public async loadManyById(ids: number[]): Promise<Array<TranslationData | null>> {
    try {
      const results = await this.idLoader.loadMany(ids);
      return results.map((result) => (result instanceof Error ? null : result));
    } catch (error) {
      this.logger.error(`다중 ID로 번역 로드 중 오류: ${error}`);
      return ids.map(() => null);
    }
  }

  /**
   * 번역 이력을 로드합니다.
   */
  public async loadHistoryByTranslationId(
    translationId: number
  ): Promise<TranslationHistoryData[]> {
    try {
      return await this.historyLoader.load(translationId);
    } catch (error) {
      this.logger.error(`번역 이력 로드 중 오류: ${error}`, { translationId });
      return [];
    }
  }

  /**
   * 소스 텍스트로 번역 이력을 로드합니다.
   */
  public async loadHistoryBySource(source: string): Promise<TranslationHistoryData[]> {
    try {
      return await this.sourceHistoryLoader.load(source);
    } catch (error) {
      this.logger.error(`소스별 번역 이력 로드 중 오류: ${error}`, { source });
      return [];
    }
  }

  /**
   * 캐시를 초기화합니다.
   */
  public clearCache(): void {
    this.sourceLoader.clearAll();
    this.idLoader.clearAll();
    this.historyLoader.clearAll();
    this.sourceHistoryLoader.clearAll();
  }

  /**
   * 특정 소스 텍스트의 캐시를 초기화합니다.
   */
  public clearSourceCache(source: string): void {
    this.sourceLoader.clear(source);
    this.sourceHistoryLoader.clear(source);
  }

  /**
   * 특정 ID의 캐시를 초기화합니다.
   */
  public clearIdCache(id: number): void {
    this.idLoader.clear(id);
    this.historyLoader.clear(id);
  }

  /**
   * 번역을 저장합니다.
   */
  public async saveTranslation(
    source: string,
    target: string,
    success: boolean = true,
    fileInfo?: FilePathInfo,
    modelName: string = 'unknown'
  ): Promise<void> {
    try {
      const dataSource = this.orm.getDataSource();

      await dataSource.transaction(async (entityManager) => {
        let savedTranslation;

        const existingTranslation = await entityManager.findOne(Translation, {
          where: { source },
        });

        if (existingTranslation) {
          // 업데이트
          existingTranslation.target = target;
          existingTranslation.success = success;
          existingTranslation.lastAccessedAt = new Date();

          if (fileInfo) {
            let fileInfoEntity = await entityManager.findOne(FileInfo, {
              where: { filePath: fileInfo.filePath },
            });

            if (!fileInfoEntity) {
              fileInfoEntity = entityManager.create(FileInfo, {
                fileName: fileInfo.fileName,
                filePath: fileInfo.filePath,
              });
              await entityManager.save(fileInfoEntity);
            }

            existingTranslation.fileInfo = fileInfoEntity;
          }

          savedTranslation = await entityManager.save(existingTranslation);
        } else {
          // 새로 생성
          const newTranslation = entityManager.create(Translation, {
            source,
            target,
            success,
          });

          if (fileInfo) {
            let fileInfoEntity = await entityManager.findOne(FileInfo, {
              where: { filePath: fileInfo.filePath },
            });

            if (!fileInfoEntity) {
              fileInfoEntity = entityManager.create(FileInfo, {
                fileName: fileInfo.fileName,
                filePath: fileInfo.filePath,
              });
              await entityManager.save(fileInfoEntity);
            }

            newTranslation.fileInfo = fileInfoEntity;
          }

          savedTranslation = await entityManager.save(newTranslation);
        }

        // 히스토리 저장
        const newHistory = entityManager.create(TranslationHistory, {
          translation: savedTranslation,
          source,
          target,
          success,
          model: modelName,
        });

        await entityManager.save(newHistory);
      });

      this.clearSourceCache(source);
    } catch (error) {
      this.logger.error(`번역 저장 중 오류: ${error}`, { source });
    }
  }

  /**
   * 여러 번역을 저장합니다.
   */
  public async saveManyTranslations(
    translations: Map<string, string>,
    success: boolean = true,
    fileInfo?: FilePathInfo,
    modelName: string = 'unknown'
  ): Promise<void> {
    try {
      const dataSource = this.orm.getDataSource();

      await dataSource.transaction(async (entityManager) => {
        for (const [source, target] of translations.entries()) {
          let savedTranslation;
          const existingTranslation = await entityManager.findOne(Translation, {
            where: { source },
          });

          if (existingTranslation) {
            // 업데이트
            existingTranslation.target = target;
            existingTranslation.success = success;
            existingTranslation.lastAccessedAt = new Date();

            if (fileInfo) {
              let fileInfoEntity = await entityManager.findOne(FileInfo, {
                where: { filePath: fileInfo.filePath },
              });

              if (!fileInfoEntity) {
                fileInfoEntity = entityManager.create(FileInfo, {
                  fileName: fileInfo.fileName,
                  filePath: fileInfo.filePath,
                });
                await entityManager.save(fileInfoEntity);
              }

              existingTranslation.fileInfo = fileInfoEntity;
            }

            savedTranslation = await entityManager.save(existingTranslation);
          } else {
            // 새로 생성
            const newTranslation = entityManager.create(Translation, {
              source,
              target,
              success,
            });

            if (fileInfo) {
              let fileInfoEntity = await entityManager.findOne(FileInfo, {
                where: { filePath: fileInfo.filePath },
              });

              if (!fileInfoEntity) {
                fileInfoEntity = entityManager.create(FileInfo, {
                  fileName: fileInfo.fileName,
                  filePath: fileInfo.filePath,
                });
                await entityManager.save(fileInfoEntity);
              }

              newTranslation.fileInfo = fileInfoEntity;
            }

            savedTranslation = await entityManager.save(newTranslation);
          }

          // 히스토리 저장
          const newHistory = entityManager.create(TranslationHistory, {
            translation: savedTranslation,
            source,
            target,
            success,
            model: modelName,
          });

          await entityManager.save(newHistory);
        }
      });

      // 캐시 초기화
      translations.forEach((_, source) => this.clearSourceCache(source));
    } catch (error) {
      this.logger.error(`다중 번역 저장 중 오류: ${error}`);
    }
  }

  /**
   * 번역을 업데이트하고 관련 캐시를 무효화합니다.
   */
  public async updateTranslation(id: number, newTarget: string): Promise<TranslationData | null> {
    try {
      const translation = await this.orm.translation.findOneBy({ id });
      if (!translation) {
        this.logger.warn(`ID가 ${id}인 번역을 찾을 수 없습니다.`);
        return null;
      }

      const oldSource = translation.source;
      translation.target = newTarget;
      translation.lastAccessedAt = new Date();

      await this.orm.translation.save(translation);

      // 캐시 무효화
      this.clearIdCache(id);
      this.clearSourceCache(oldSource);

      // 업데이트된 데이터로 캐시 프라이밍
      this.idLoader.prime(id, translation);
      this.sourceLoader.prime(oldSource, translation);

      this.logger.info(`ID가 ${id}인 번역이 업데이트되었습니다.`);
      return translation;
    } catch (error) {
      this.logger.error(`ID가 ${id}인 번역 업데이트 중 오류:`, { error });
      return null;
    }
  }

  /**
   * 여러 번역을 ID로 삭제하고 관련 캐시를 무효화합니다.
   */
  public async deleteTranslationsByIds(ids: number[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      // 삭제 전, 캐시 무효화를 위해 source를 미리 조회
      const translationsToDelete = await this.orm.translation.find({
        where: { id: In(ids) },
        select: ['id', 'source'],
      });

      if (translationsToDelete.length === 0) return;

      await this.orm.translation.delete(ids);

      // 캐시 무효화
      translationsToDelete.forEach((t) => {
        this.clearIdCache(t.id);
        this.clearSourceCache(t.source);
      });

      this.logger.info(`${ids.length}개의 번역이 삭제되었습니다.`);
    } catch (error) {
      this.logger.error('ID로 번역 삭제 중 오류:', { error, ids });
    }
  }
}
