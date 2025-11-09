/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslateImageRequestDto } from '../models/TranslateImageRequestDto';
import type { TranslateImageResponseDto } from '../models/TranslateImageResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ImageTranslatorService {
    /**
     * @returns TranslateImageResponseDto 이미지를 번역하고 OCR/번역 결과를 반환합니다.
     * @throws ApiError
     */
    public static imageTranslatorControllerTranslateImage({
        requestBody,
    }: {
        requestBody: TranslateImageRequestDto,
    }): CancelablePromise<TranslateImageResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/translator/image/translate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
