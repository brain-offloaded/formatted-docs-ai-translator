/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TranslationHistoryDto = {
    /**
     * 원본 텍스트
     */
    source: string;
    /**
     * 번역된 텍스트
     */
    target: string;
    /**
     * 번역 성공 여부
     */
    success: boolean;
    /**
     * 번역 실패 시 오류 메시지
     */
    error?: string | null;
    /**
     * 번역 요청에 사용된 모델 이름
     */
    model: string;
    /**
     * 이력이 기록된 시각
     */
    createdAt: string;
    /**
     * 번역 시 사용된 캐시 태그 이름
     */
    cacheTag: string;
};

