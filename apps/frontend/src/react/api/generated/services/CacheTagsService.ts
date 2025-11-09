/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteCacheTagBodyDto } from '../models/DeleteCacheTagBodyDto';
import type { DeleteCacheTagResponseDto } from '../models/DeleteCacheTagResponseDto';
import type { GetCacheTagsResponseDto } from '../models/GetCacheTagsResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CacheTagsService {
    /**
     * @returns GetCacheTagsResponseDto 캐시 태그 목록을 조회합니다.
     * @throws ApiError
     */
    public static cacheTagsControllerGetCacheTags({
        keyword,
        sortBy,
        sortOrder,
    }: {
        /**
         * 태그 이름 검색 키워드
         */
        keyword?: string,
        /**
         * 정렬 기준
         */
        sortBy?: 'lastUsedAt' | 'name' | 'createdAt',
        /**
         * 정렬 순서
         */
        sortOrder?: 'asc' | 'desc',
    }): CancelablePromise<GetCacheTagsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cache/tags',
            query: {
                'keyword': keyword,
                'sortBy': sortBy,
                'sortOrder': sortOrder,
            },
        });
    }
    /**
     * @returns DeleteCacheTagResponseDto 캐시 태그를 삭제합니다.
     * @throws ApiError
     */
    public static cacheTagsControllerDeleteCacheTag({
        id,
        requestBody,
    }: {
        /**
         * 삭제할 캐시 태그 ID
         */
        id: number,
        requestBody: DeleteCacheTagBodyDto,
    }): CancelablePromise<DeleteCacheTagResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/cache/tags/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
