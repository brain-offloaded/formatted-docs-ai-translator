/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CacheTagSummaryDto } from './CacheTagSummaryDto';
export type GetCacheTagsResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 캐시 태그 목록
     */
    cacheTags: Array<CacheTagSummaryDto>;
};

