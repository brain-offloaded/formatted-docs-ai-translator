/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslationTextPathDto } from './TranslationTextPathDto';
import type { TranslatorAiSettingsDto } from './TranslatorAiSettingsDto';
export type TranslateTextArrayRequestDto = {
    /**
     * 번역 요청 식별자
     */
    requestId: string;
    /**
     * AI 번역기에 전달할 설정 값
     */
    aiSettings: TranslatorAiSettingsDto;
    /**
     * 번역 대상 텍스트 배열
     */
    textPaths: Array<TranslationTextPathDto>;
    /**
     * 번역 대상 원본 파일 경로
     */
    sourceFilePath?: string;
    /**
     * 프롬프트 프리셋 내용
     */
    promptPresetContent?: string;
    /**
     * 번역 결과를 저장할 캐시 태그
     */
    cacheTag: string;
};

