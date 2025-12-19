/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TranslatorModelConfigDto = {
    /**
     * 번역 모델 이름
     */
    modelName: string;
    /**
     * 분당 허용 요청 수
     */
    requestsPerMinute: number;
    /**
     * 출력 토큰의 최대 개수
     */
    maxOutputTokenCount: number;
    /**
     * 동시에 처리할 최대 요청 수
     */
    maxConcurrentRequests: number;
};

