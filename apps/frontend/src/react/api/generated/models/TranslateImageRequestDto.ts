/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslatorAiSettingsDto } from './TranslatorAiSettingsDto';
export type TranslateImageRequestDto = {
    /**
     * Base64로 인코딩된 원본 이미지 데이터
     */
    base64: string;
    /**
     * 원본 이미지 파일 경로
     */
    sourceFilePath?: string;
    /**
     * 이미지 번역에 사용할 프롬프트 프리셋 내용
     */
    promptPresetContent?: string;
    /**
     * 번역 결과를 저장할 캐시 태그
     */
    cacheTag?: string;
    /**
     * 번역 요청을 구분하기 위한 고유 ID
     */
    requestId: string;
    /**
     * AI 번역기에 전달할 설정 값
     */
    aiSettings: TranslatorAiSettingsDto;
};

