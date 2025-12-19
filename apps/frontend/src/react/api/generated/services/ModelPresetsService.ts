/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateModelPresetRequestDto } from '../models/CreateModelPresetRequestDto';
import type { CreateModelPresetResponseDto } from '../models/CreateModelPresetResponseDto';
import type { DeleteModelPresetResponseDto } from '../models/DeleteModelPresetResponseDto';
import type { GetModelPresetDetailResponseDto } from '../models/GetModelPresetDetailResponseDto';
import type { GetModelPresetsResponseDto } from '../models/GetModelPresetsResponseDto';
import type { UpdateModelPresetBodyDto } from '../models/UpdateModelPresetBodyDto';
import type { UpdateModelPresetResponseDto } from '../models/UpdateModelPresetResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ModelPresetsService {
    /**
     * @returns GetModelPresetsResponseDto 모델 프리셋 목록을 조회합니다.
     * @throws ApiError
     */
    public static modelPresetControllerGetModelPresets(): CancelablePromise<GetModelPresetsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/model-presets',
        });
    }
    /**
     * @returns CreateModelPresetResponseDto 모델 프리셋을 생성합니다.
     * @throws ApiError
     */
    public static modelPresetControllerCreateModelPreset({
        requestBody,
    }: {
        requestBody: CreateModelPresetRequestDto,
    }): CancelablePromise<CreateModelPresetResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/model-presets',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns GetModelPresetDetailResponseDto 모델 프리셋 상세 정보를 조회합니다.
     * @throws ApiError
     */
    public static modelPresetControllerGetModelPresetDetail({
        id,
    }: {
        id: number,
    }): CancelablePromise<GetModelPresetDetailResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/model-presets/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns UpdateModelPresetResponseDto 모델 프리셋을 업데이트합니다.
     * @throws ApiError
     */
    public static modelPresetControllerUpdateModelPreset({
        id,
        requestBody,
    }: {
        id: number,
        requestBody: UpdateModelPresetBodyDto,
    }): CancelablePromise<UpdateModelPresetResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/model-presets/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DeleteModelPresetResponseDto 모델 프리셋을 삭제합니다.
     * @throws ApiError
     */
    public static modelPresetControllerDeleteModelPreset({
        id,
    }: {
        id: number,
    }): CancelablePromise<DeleteModelPresetResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/model-presets/{id}',
            path: {
                'id': id,
            },
        });
    }
}
