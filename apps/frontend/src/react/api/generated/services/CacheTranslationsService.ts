/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteCacheTranslationsRequestDto } from '../models/DeleteCacheTranslationsRequestDto';
import type { DeleteCacheTranslationsResponseDto } from '../models/DeleteCacheTranslationsResponseDto';
import type { ExportTranslationsResponseDto } from '../models/ExportTranslationsResponseDto';
import type { GetCacheTranslationsResponseDto } from '../models/GetCacheTranslationsResponseDto';
import type { GetTranslationHistoryResponseDto } from '../models/GetTranslationHistoryResponseDto';
import type { ImportTranslationsRequestDto } from '../models/ImportTranslationsRequestDto';
import type { ImportTranslationsResponseDto } from '../models/ImportTranslationsResponseDto';
import type { UpdateTranslationBodyDto } from '../models/UpdateTranslationBodyDto';
import type { UpdateTranslationCacheTagBodyDto } from '../models/UpdateTranslationCacheTagBodyDto';
import type { UpdateTranslationCacheTagResponseDto } from '../models/UpdateTranslationCacheTagResponseDto';
import type { UpdateTranslationResponseDto } from '../models/UpdateTranslationResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CacheTranslationsService {
    /**
     * @returns GetCacheTranslationsResponseDto 번역 캐시 목록을 조회합니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerGetTranslations({
        searchType,
        searchValue,
        startDate,
        endDate,
        page = 1,
        itemsPerPage = 20,
    }: {
        /**
         * 검색 기준
         */
        searchType?: 'source' | 'target' | 'fileName' | 'filePath' | 'date' | 'cacheTag',
        /**
         * 검색어
         */
        searchValue?: string,
        /**
         * 검색 시작일 (YYYY-MM-DD)
         */
        startDate?: string,
        /**
         * 검색 종료일 (YYYY-MM-DD)
         */
        endDate?: string,
        /**
         * 요청할 페이지 번호 (1부터 시작)
         */
        page?: number,
        /**
         * 페이지당 항목 수
         */
        itemsPerPage?: number,
    }): CancelablePromise<GetCacheTranslationsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cache/translations',
            query: {
                'searchType': searchType,
                'searchValue': searchValue,
                'startDate': startDate,
                'endDate': endDate,
                'page': page,
                'itemsPerPage': itemsPerPage,
            },
        });
    }
    /**
     * @returns DeleteCacheTranslationsResponseDto 선택된 번역을 삭제하거나 검색 조건에 맞는 모든 번역을 삭제합니다. `translationIds` 또는 `searchParams` 중 하나는 필수입니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerDeleteTranslations({
        requestBody,
    }: {
        requestBody: DeleteCacheTranslationsRequestDto,
    }): CancelablePromise<DeleteCacheTranslationsResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/cache/translations',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns GetTranslationHistoryResponseDto 선택한 번역의 이력을 조회합니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerGetTranslationHistory({
        translationId,
    }: {
        /**
         * 대상 번역 ID
         */
        translationId: number,
    }): CancelablePromise<GetTranslationHistoryResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cache/translations/{translationId}/history',
            path: {
                'translationId': translationId,
            },
        });
    }
    /**
     * @returns UpdateTranslationResponseDto 번역 결과를 수정합니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerUpdateTranslation({
        translationId,
        requestBody,
    }: {
        /**
         * 대상 번역 ID
         */
        translationId: number,
        requestBody: UpdateTranslationBodyDto,
    }): CancelablePromise<UpdateTranslationResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/cache/translations/{translationId}',
            path: {
                'translationId': translationId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns UpdateTranslationCacheTagResponseDto 번역의 캐시 태그를 변경합니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerUpdateTranslationCacheTag({
        translationId,
        requestBody,
    }: {
        /**
         * 대상 번역 ID
         */
        translationId: number,
        requestBody: UpdateTranslationCacheTagBodyDto,
    }): CancelablePromise<UpdateTranslationCacheTagResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/cache/translations/{translationId}/cache-tag',
            path: {
                'translationId': translationId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ExportTranslationsResponseDto 검색 조건에 맞는 번역을 내보냅니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerExportTranslations({
        searchType,
        searchValue,
        startDate,
        endDate,
    }: {
        /**
         * 검색 기준
         */
        searchType?: 'source' | 'target' | 'fileName' | 'filePath' | 'date' | 'cacheTag',
        /**
         * 검색어
         */
        searchValue?: string,
        /**
         * 검색 시작일 (YYYY-MM-DD)
         */
        startDate?: string,
        /**
         * 검색 종료일 (YYYY-MM-DD)
         */
        endDate?: string,
    }): CancelablePromise<ExportTranslationsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cache/translations/export',
            query: {
                'searchType': searchType,
                'searchValue': searchValue,
                'startDate': startDate,
                'endDate': endDate,
            },
        });
    }
    /**
     * @returns ImportTranslationsResponseDto 번역을 가져옵니다.
     * @throws ApiError
     */
    public static cacheTranslationsControllerImportTranslations({
        requestBody,
    }: {
        requestBody: ImportTranslationsRequestDto,
    }): CancelablePromise<ImportTranslationsResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/cache/translations/import',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
