/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LogSearchParamsDto = {
    /**
     * 필터링할 로그 레벨 목록
     */
    levels?: Array<string>;
    /**
     * 조회 시작 일자 (YYYY-MM-DD 또는 YYYY/MM/DD)
     */
    startDate?: string;
    /**
     * 조회 종료 일자 (YYYY-MM-DD 또는 YYYY/MM/DD)
     */
    endDate?: string;
};

