import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';

import { IMemoryCacheManagerService } from './i-memory-cache-manager-service';

@Injectable()
export class LruCacheManagerService implements IMemoryCacheManagerService {
  private cache: LRUCache<string, string>;

  /**
   * LruCacheManagerService 생성자
   * @param configService NestJS Config Service
   */
  constructor(private readonly configService: ConfigService) {
    const max = this.configService.get<number>('CACHE_MAX_ITEMS', 1000);
    const ttl = this.configService.get<number>('CACHE_TTL_MS', 24 * 60 * 60 * 1000); // 기본 24시간

    this.cache = new LRUCache<string, string>({
      max,
      ttl,
      updateAgeOnGet: true,
      allowStale: false,
    });
  }

  /**
   * 캐시 초기화
   */
  public async initialize(): Promise<void> {
    // LRU 캐시는 별도의 초기화가 필요 없음
  }

  /**
   * 캐시 종료
   */
  public async close(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 텍스트에 대한 번역 조회
   * @param text 원본 텍스트
   * @returns 캐시된 번역 또는 null
   */
  public async getTranslation(text: string): Promise<string | null> {
    return this.cache.get(text) || null;
  }

  /**
   * 텍스트와 번역을 캐시에 저장
   * @param text 원본 텍스트
   * @param translation 번역 텍스트
   */
  public async setTranslation(text: string, translation: string): Promise<void> {
    this.cache.set(text, translation);
  }

  /**
   * 여러 텍스트에 대한 번역 일괄 조회
   * @param texts 원본 텍스트 배열
   * @returns 텍스트별 번역 매핑 (번역이 없는 경우 null)
   */
  public async getTranslations(texts: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();

    for (const text of texts) {
      const translation = this.cache.get(text);
      result.set(text, translation || null);
    }

    return result;
  }

  /**
   * 여러 텍스트와 번역을 일괄 저장
   * @param translations 텍스트-번역 매핑
   */
  public async setTranslations(translations: Map<string, string>): Promise<void> {
    for (const [text, translation] of translations) {
      this.cache.set(text, translation);
    }
  }

  /**
   * 캐시 초기화 (전체 삭제)
   */
  public async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 특정 텍스트에 대한 캐시 항목 무효화
   * @param text 캐시에서 제거할 텍스트
   */
  public async invalidate(text: string): Promise<void> {
    this.cache.delete(text);
  }

  /**
   * 여러 텍스트에 대한 캐시 항목 무효화
   * @param texts 캐시에서 제거할 텍스트 배열
   */
  public async invalidateMany(texts: string[]): Promise<void> {
    for (const text of texts) {
      this.cache.delete(text);
    }
  }
}
