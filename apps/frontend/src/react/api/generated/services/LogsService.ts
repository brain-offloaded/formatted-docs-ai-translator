/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteLogsRequestDto } from '../models/DeleteLogsRequestDto';
import type { DeleteLogsResponseDto } from '../models/DeleteLogsResponseDto';
import type { GetLogDetailResponseDto } from '../models/GetLogDetailResponseDto';
import type { GetLogsResponseDto } from '../models/GetLogsResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LogsService {
    /**
     * @returns GetLogsResponseDto 로그 목록을 조회합니다.
     * @throws ApiError
     */
    public static loggerControllerGetLogs({
        page = 1,
        itemsPerPage = 20,
        levels,
        startDate,
        endDate,
    }: {
        /**
         * 조회할 페이지 번호
         */
        page?: number,
        /**
         * 페이지당 조회할 항목 수
         */
        itemsPerPage?: number,
        /**
         * 필터링할 로그 레벨 목록
         */
        levels?: Array<string>,
        /**
         * 조회 시작 일자 (YYYY-MM-DD 또는 YYYY/MM/DD)
         */
        startDate?: string,
        /**
         * 조회 종료 일자 (YYYY-MM-DD 또는 YYYY/MM/DD)
         */
        endDate?: string,
    }): CancelablePromise<GetLogsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/logs',
            query: {
                'page': page,
                'itemsPerPage': itemsPerPage,
                'levels': levels,
                'startDate': startDate,
                'endDate': endDate,
            },
        });
    }
    /**
     * @returns DeleteLogsResponseDto 선택한 로그 또는 조건에 맞는 로그를 삭제합니다.
     * @throws ApiError
     */
    public static loggerControllerDeleteLogs({
        requestBody,
    }: {
        requestBody: DeleteLogsRequestDto,
    }): CancelablePromise<DeleteLogsResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/logs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns GetLogDetailResponseDto 특정 로그의 상세 정보를 조회합니다.
     * @throws ApiError
     */
    public static loggerControllerGetLogDetail({
        id,
    }: {
        /**
         * 조회 대상 로그 ID
         */
        id: number,
    }): CancelablePromise<GetLogDetailResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/logs/{id}',
            path: {
                'id': id,
            },
        });
    }
}
