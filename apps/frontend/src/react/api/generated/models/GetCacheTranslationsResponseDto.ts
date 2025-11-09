/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CacheTranslationDto } from './CacheTranslationDto';
export type GetCacheTranslationsResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 조회된 번역 목록
     */
    translations: Array<CacheTranslationDto>;
    /**
     * 전체 항목 수
     */
    totalItems: number;
};

