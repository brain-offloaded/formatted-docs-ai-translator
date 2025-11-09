/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CacheTranslationDto = {
    /**
     * 번역 캐시 ID
     */
    id: number;
    /**
     * 원본 텍스트
     */
    source: string;
    /**
     * 번역된 텍스트
     */
    target: string;
    /**
     * 항목이 생성된 시각
     */
    createdAt: string;
    /**
     * 마지막으로 접근된 시각
     */
    lastAccessedAt: string;
    /**
     * 연결된 캐시 태그 이름
     */
    cacheTag: string;
    /**
     * 연결된 캐시 태그 ID, 없을 경우 null
     */
    cacheTagId?: number | null;
    /**
     * 연관된 파일 이름
     */
    fileName?: string | null;
    /**
     * 연관된 파일 경로
     */
    filePath?: string | null;
};

