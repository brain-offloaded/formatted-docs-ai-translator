/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateExamplePresetRequestDto } from '../models/CreateExamplePresetRequestDto';
import type { CreateExamplePresetResponseDto } from '../models/CreateExamplePresetResponseDto';
import type { DeleteExamplePresetResponseDto } from '../models/DeleteExamplePresetResponseDto';
import type { GetExamplePresetDetailResponseDto } from '../models/GetExamplePresetDetailResponseDto';
import type { GetExamplePresetExamplesResponseDto } from '../models/GetExamplePresetExamplesResponseDto';
import type { GetExamplePresetsResponseDto } from '../models/GetExamplePresetsResponseDto';
import type { LoadExamplePresetRequestDto } from '../models/LoadExamplePresetRequestDto';
import type { LoadExamplePresetResponseDto } from '../models/LoadExamplePresetResponseDto';
import type { UpdateExamplePresetRequestDto } from '../models/UpdateExamplePresetRequestDto';
import type { UpdateExamplePresetResponseDto } from '../models/UpdateExamplePresetResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExamplePresetsService {
    /**
     * @returns GetExamplePresetsResponseDto 예제 프리셋 목록을 조회합니다.
     * @throws ApiError
     */
    public static examplePresetControllerGetExamplePresets(): CancelablePromise<GetExamplePresetsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/example-presets',
        });
    }
    /**
     * @returns CreateExamplePresetResponseDto 예제 프리셋을 생성합니다.
     * @throws ApiError
     */
    public static examplePresetControllerCreateExamplePreset({
        requestBody,
    }: {
        requestBody: CreateExamplePresetRequestDto,
    }): CancelablePromise<CreateExamplePresetResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/example-presets',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns GetExamplePresetDetailResponseDto 예제 프리셋 상세 정보를 조회합니다.
     * @throws ApiError
     */
    public static examplePresetControllerGetExamplePresetDetail({
        id,
    }: {
        /**
         * 프리셋 ID
         */
        id: number,
    }): CancelablePromise<GetExamplePresetDetailResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/example-presets/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns DeleteExamplePresetResponseDto 예제 프리셋을 삭제합니다.
     * @throws ApiError
     */
    public static examplePresetControllerDeleteExamplePreset({
        id,
    }: {
        /**
         * 프리셋 ID
         */
        id: number,
    }): CancelablePromise<DeleteExamplePresetResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/example-presets/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns UpdateExamplePresetResponseDto 예제 프리셋을 수정합니다.
     * @throws ApiError
     */
    public static examplePresetControllerUpdateExamplePreset({
        id,
        requestBody,
    }: {
        /**
         * 프리셋 ID
         */
        id: number,
        requestBody: UpdateExamplePresetRequestDto,
    }): CancelablePromise<UpdateExamplePresetResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/example-presets/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns GetExamplePresetExamplesResponseDto 특정 언어 쌍에 대한 예제 문장을 조회합니다.
     * @throws ApiError
     */
    public static examplePresetControllerGetExamplePresetExamples({
        id,
        sourceLanguage,
        targetLanguage,
    }: {
        /**
         * 프리셋 ID
         */
        id: number,
        /**
         * 예제를 조회할 소스 언어
         */
        sourceLanguage: 'ko' | 'en' | 'ja' | 'zh',
        /**
         * 예제를 조회할 타겟 언어
         */
        targetLanguage: 'ko' | 'en' | 'ja' | 'zh',
    }): CancelablePromise<GetExamplePresetExamplesResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/example-presets/{id}/examples',
            path: {
                'id': id,
            },
            query: {
                'sourceLanguage': sourceLanguage,
                'targetLanguage': targetLanguage,
            },
        });
    }
    /**
     * @returns LoadExamplePresetResponseDto 예제 프리셋을 로드합니다.
     * @throws ApiError
     */
    public static examplePresetControllerLoadExamplePreset({
        requestBody,
    }: {
        requestBody: LoadExamplePresetRequestDto,
    }): CancelablePromise<LoadExamplePresetResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/example-presets/load',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
