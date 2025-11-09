/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CacheTranslationsSearchParamsDto = {
    /**
     * 검색 기준
     */
    searchType?: CacheTranslationsSearchParamsDto.searchType;
    /**
     * 검색어
     */
    searchValue?: string;
    /**
     * 검색 시작일 (YYYY-MM-DD)
     */
    startDate?: string;
    /**
     * 검색 종료일 (YYYY-MM-DD)
     */
    endDate?: string;
};
export namespace CacheTranslationsSearchParamsDto {
    /**
     * 검색 기준
     */
    export enum searchType {
        SOURCE = 'source',
        TARGET = 'target',
        FILE_NAME = 'fileName',
        FILE_PATH = 'filePath',
        DATE = 'date',
        CACHE_TAG = 'cacheTag',
    }
}

