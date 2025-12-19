/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslatorModelConfigDto } from './TranslatorModelConfigDto';
export type TranslatorAiSettingsDto = {
    /**
     * 사용할 AI 모델 제공자
     */
    modelProvider: TranslatorAiSettingsDto.modelProvider;
    /**
     * 원본 언어
     */
    sourceLanguage: TranslatorAiSettingsDto.sourceLanguage;
    /**
     * 번역 대상 언어
     */
    targetLanguage: TranslatorAiSettingsDto.targetLanguage;
    /**
     * AI 제공자에 전달할 API 키 (공백으로 구분된 복수 키 허용)
     */
    apiKey: string;
    /**
     * OpenAI-compatible 제공자의 Base URL
     */
    baseUrl?: string;
    /**
     * AI 모델 동작에 필요한 설정
     */
    customModelConfig: TranslatorModelConfigDto;
    /**
     * 모델의 생각(Reasoning) 모드를 사용할지 여부
     */
    useThinking: boolean;
    /**
     * 커스텀 생각 예산을 구성할지 여부
     */
    setThinkingBudget: boolean;
    /**
     * 생각 모드 활성화 시 사용하는 토큰 예산
     */
    thinkingBudget?: number;
};
export namespace TranslatorAiSettingsDto {
    /**
     * 사용할 AI 모델 제공자
     */
    export enum modelProvider {
        GOOGLE = 'Google',
        VERTEX_AI = 'vertex-ai',
        OPENAI_COMPATIBLE = 'openai-compatible',
    }
    /**
     * 원본 언어
     */
    export enum sourceLanguage {
        ANY = 'any',
        KO = 'ko',
        EN = 'en',
        JA = 'ja',
        ZH = 'zh',
    }
    /**
     * 번역 대상 언어
     */
    export enum targetLanguage {
        KO = 'ko',
        EN = 'en',
        JA = 'ja',
        ZH = 'zh',
    }
}

