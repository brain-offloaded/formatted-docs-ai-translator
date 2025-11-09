/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LogListItemDto } from './LogListItemDto';
export type GetLogsResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 로그 목록
     */
    logs: Array<LogListItemDto>;
    /**
     * 총 로그 개수
     */
    totalItems: number;
};

