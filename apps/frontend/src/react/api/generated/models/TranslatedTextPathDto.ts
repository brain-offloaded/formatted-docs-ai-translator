/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TranslatedTextPathDto = {
    /**
     * 번역 대상 텍스트
     */
    text: string;
    /**
     * 텍스트를 식별하기 위한 경로 또는 키
     */
    path: string;
    /**
     * 추가 메타데이터
     */
    extra?: Record<string, any>;
    /**
     * 번역 결과 텍스트
     */
    translatedText: string;
};

