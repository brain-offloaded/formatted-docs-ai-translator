/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExamplePresetDto } from './ExamplePresetDto';
export type GetExamplePresetsResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 예제 프리셋 목록
     */
    presets: Array<ExamplePresetDto>;
    /**
     * 현재 선택된 프리셋 이름
     */
    currentPreset: string;
};

