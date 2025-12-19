/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ModelPresetDto = {
    /**
     * 모델 프리셋 ID
     */
    id: number;
    /**
     * 모델 프리셋 이름
     */
    name: string;
    /**
     * AI 모델 제공자
     */
    modelProvider: ModelPresetDto.modelProvider;
    /**
     * OpenAI-compatible 제공자의 Base URL
     */
    baseUrl?: string;
    /**
     * AI 제공자에 전달할 API 키 (공백으로 구분된 복수 키 허용)
     */
    apiKey: string;
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
export namespace ModelPresetDto {
    /**
     * AI 모델 제공자
     */
    export enum modelProvider {
        GOOGLE = 'Google',
        VERTEX_AI = 'vertex-ai',
        OPENAI_COMPATIBLE = 'openai-compatible',
    }
}

