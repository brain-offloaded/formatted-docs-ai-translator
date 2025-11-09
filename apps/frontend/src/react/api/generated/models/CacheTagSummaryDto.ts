/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CacheTagSummaryDto = {
    /**
     * 캐시 태그 ID
     */
    id: number;
    /**
     * 캐시 태그 이름
     */
    name: string;
    /**
     * 태그가 생성된 시각
     */
    createdAt: string;
    /**
     * 태그가 마지막으로 수정된 시각
     */
    updatedAt: string;
    /**
     * 태그가 마지막으로 사용된 시각
     */
    lastUsedAt?: string | null;
    /**
     * 태그에 연결된 번역 개수
     */
    translationCount: number;
};

