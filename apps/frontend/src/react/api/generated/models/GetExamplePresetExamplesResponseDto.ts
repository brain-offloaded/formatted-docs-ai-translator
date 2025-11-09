/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExamplePresetExampleLineDto } from './ExamplePresetExampleLineDto';
export type GetExamplePresetExamplesResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 예제를 조회한 소스 언어
     */
    sourceLanguage: GetExamplePresetExamplesResponseDto.sourceLanguage;
    /**
     * 예제를 조회한 타겟 언어
     */
    targetLanguage: GetExamplePresetExamplesResponseDto.targetLanguage;
    /**
     * 요청한 언어 쌍에 해당하는 예제 문장 목록
     */
    examples: Array<ExamplePresetExampleLineDto>;
};
export namespace GetExamplePresetExamplesResponseDto {
    /**
     * 예제를 조회한 소스 언어
     */
    export enum sourceLanguage {
        KO = 'ko',
        EN = 'en',
        JA = 'ja',
        ZH = 'zh',
    }
    /**
     * 예제를 조회한 타겟 언어
     */
    export enum targetLanguage {
        KO = 'ko',
        EN = 'en',
        JA = 'ja',
        ZH = 'zh',
    }
}

