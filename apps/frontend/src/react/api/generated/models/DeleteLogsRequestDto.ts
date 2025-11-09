/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LogSearchParamsDto } from './LogSearchParamsDto';
export type DeleteLogsRequestDto = {
    /**
     * 삭제할 로그 ID 목록
     */
    logIds?: Array<number>;
    /**
     * 검색 조건과 일치하는 로그를 삭제할 때 사용하는 필터
     */
    searchParams?: LogSearchParamsDto;
};

