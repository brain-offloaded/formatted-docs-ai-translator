/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslationHistoryDto } from './TranslationHistoryDto';
export type GetTranslationHistoryResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 선택한 번역의 이력 목록
     */
    translationHistory: Array<TranslationHistoryDto>;
};

