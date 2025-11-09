/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslatedTextPathDto } from './TranslatedTextPathDto';
export type TranslateTextArrayResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 번역 결과 텍스트 경로 목록
     */
    translatedTextPaths: Array<TranslatedTextPathDto>;
};

