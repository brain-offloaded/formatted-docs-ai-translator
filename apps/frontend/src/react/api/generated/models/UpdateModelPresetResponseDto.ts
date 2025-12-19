/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModelPresetDto } from './ModelPresetDto';
export type UpdateModelPresetResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 업데이트된 모델 프리셋 정보
     */
    preset?: ModelPresetDto;
};

