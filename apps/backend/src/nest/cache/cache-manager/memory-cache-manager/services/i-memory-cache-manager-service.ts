/**
 * 메모리 캐시 관리 인터페이스
 * 메모리 캐시 매니저 클래스들이 구현하는 인터페이스입니다.
 */
export interface IMemoryCacheManagerService {
  // 생명주기 관련 메서드
  initialize(): Promise<void>;
  close(): Promise<void>;

  // 기본 캐시 조작 메서드
  getTranslation(text: string): Promise<string | null>;
  setTranslation(text: string, translation: string): Promise<void>;
  getTranslations(texts: string[]): Promise<Map<string, string | null>>;
  setTranslations(translations: Map<string, string>): Promise<void>;

  // 캐시 무효화 메서드
  invalidate(text: string): Promise<void>;
  invalidateMany(texts: string[]): Promise<void>;

  // 초기화
  clear(): Promise<void>;
}

export const IMemoryCacheManagerService = Symbol('IMemoryCacheManagerService');
