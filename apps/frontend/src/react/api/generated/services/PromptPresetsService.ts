/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePromptPresetRequestDto } from '../models/CreatePromptPresetRequestDto';
import type { CreatePromptPresetResponseDto } from '../models/CreatePromptPresetResponseDto';
import type { DeletePromptPresetResponseDto } from '../models/DeletePromptPresetResponseDto';
import type { GetPromptPresetDetailResponseDto } from '../models/GetPromptPresetDetailResponseDto';
import type { GetPromptPresetsResponseDto } from '../models/GetPromptPresetsResponseDto';
import type { UpdatePromptPresetBodyDto } from '../models/UpdatePromptPresetBodyDto';
import type { UpdatePromptPresetResponseDto } from '../models/UpdatePromptPresetResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PromptPresetsService {
    /**
     * @returns GetPromptPresetsResponseDto 프롬프트 프리셋 목록을 조회합니다.
     * @throws ApiError
     */
    public static promptPresetControllerGetPromptPresets({
        type,
    }: {
        /**
         * 프롬프트 프리셋 타입 필터
         */
        type?: 'text' | 'image',
    }): CancelablePromise<GetPromptPresetsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/prompt-presets',
            query: {
                'type': type,
            },
        });
    }
    /**
     * @returns CreatePromptPresetResponseDto 프롬프트 프리셋을 생성합니다.
     * @throws ApiError
     */
    public static promptPresetControllerCreatePromptPreset({
        requestBody,
    }: {
        requestBody: CreatePromptPresetRequestDto,
    }): CancelablePromise<CreatePromptPresetResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/prompt-presets',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns GetPromptPresetDetailResponseDto 프롬프트 프리셋 상세 정보를 조회합니다.
     * @throws ApiError
     */
    public static promptPresetControllerGetPromptPresetDetail({
        id,
    }: {
        id: number,
    }): CancelablePromise<GetPromptPresetDetailResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/prompt-presets/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns UpdatePromptPresetResponseDto 프롬프트 프리셋을 업데이트합니다.
     * @throws ApiError
     */
    public static promptPresetControllerUpdatePromptPreset({
        id,
        requestBody,
    }: {
        id: number,
        requestBody: UpdatePromptPresetBodyDto,
    }): CancelablePromise<UpdatePromptPresetResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/prompt-presets/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DeletePromptPresetResponseDto 프롬프트 프리셋을 삭제합니다.
     * @throws ApiError
     */
    public static promptPresetControllerDeletePromptPreset({
        id,
    }: {
        id: number,
    }): CancelablePromise<DeletePromptPresetResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/prompt-presets/{id}',
            path: {
                'id': id,
            },
        });
    }
}
