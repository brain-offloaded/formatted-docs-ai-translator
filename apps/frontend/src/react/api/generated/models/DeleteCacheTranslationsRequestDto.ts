/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CacheTranslationsSearchParamsDto } from './CacheTranslationsSearchParamsDto';
export type DeleteCacheTranslationsRequestDto = {
    /**
     * 삭제할 번역 ID 목록
     */
    translationIds?: Array<number>;
    /**
     * 검색 조건에 해당하는 모든 번역 삭제 시 사용되는 조건
     */
    searchParams?: CacheTranslationsSearchParamsDto;
};

