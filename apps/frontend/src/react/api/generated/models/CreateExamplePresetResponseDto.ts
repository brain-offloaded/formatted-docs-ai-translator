/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExamplePresetDto } from './ExamplePresetDto';
export type CreateExamplePresetResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 생성된 예제 프리셋 정보
     */
    preset: ExamplePresetDto;
};

