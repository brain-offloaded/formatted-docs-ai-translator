/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PromptPresetDetailDto } from './PromptPresetDetailDto';
export type GetPromptPresetDetailResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 프롬프트 프리셋 상세 정보
     */
    preset?: PromptPresetDetailDto;
};

