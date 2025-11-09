/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteSettingResponseDto } from '../models/DeleteSettingResponseDto';
import type { GetAllSettingsResponseDto } from '../models/GetAllSettingsResponseDto';
import type { GetSettingResponseDto } from '../models/GetSettingResponseDto';
import type { UpdateSettingRequestDto } from '../models/UpdateSettingRequestDto';
import type { UpdateSettingResponseDto } from '../models/UpdateSettingResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsService {
    /**
     * @returns GetSettingResponseDto 설정 값을 조회합니다.
     * @throws ApiError
     */
    public static settingsControllerGetSetting({
        key,
    }: {
        /**
         * 설정을 조회하거나 수정할 때 사용하는 키
         */
        key: string,
    }): CancelablePromise<GetSettingResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/{key}',
            path: {
                'key': key,
            },
        });
    }
    /**
     * @returns UpdateSettingResponseDto 설정 값을 생성하거나 업데이트합니다.
     * @throws ApiError
     */
    public static settingsControllerUpdateSetting({
        key,
        requestBody,
    }: {
        /**
         * 설정을 조회하거나 수정할 때 사용하는 키
         */
        key: string,
        requestBody: UpdateSettingRequestDto,
    }): CancelablePromise<UpdateSettingResponseDto> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/{key}',
            path: {
                'key': key,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DeleteSettingResponseDto 설정을 삭제합니다.
     * @throws ApiError
     */
    public static settingsControllerDeleteSetting({
        key,
    }: {
        /**
         * 설정을 조회하거나 수정할 때 사용하는 키
         */
        key: string,
    }): CancelablePromise<DeleteSettingResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/{key}',
            path: {
                'key': key,
            },
        });
    }
    /**
     * @returns GetAllSettingsResponseDto 등록된 모든 설정을 조회합니다.
     * @throws ApiError
     */
    public static settingsControllerGetAllSettings(): CancelablePromise<GetAllSettingsResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings',
        });
    }
}
