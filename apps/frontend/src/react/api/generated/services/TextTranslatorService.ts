/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslateTextArrayRequestDto } from '../models/TranslateTextArrayRequestDto';
import type { TranslateTextArrayResponseDto } from '../models/TranslateTextArrayResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TextTranslatorService {
    /**
     * @returns TranslateTextArrayResponseDto 텍스트 배열을 번역합니다.
     * @throws ApiError
     */
    public static textTranslatorControllerTranslateText({
        requestBody,
    }: {
        requestBody: TranslateTextArrayRequestDto,
    }): CancelablePromise<TranslateTextArrayResponseDto> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/translator/text/translate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any 텍스트 배열을 번역하며 진행률을 NDJSON 스트림으로 전송합니다.
     * @throws ApiError
     */
    public static textTranslatorControllerStreamTranslateText({
        requestBody,
    }: {
        requestBody: TranslateTextArrayRequestDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/translator/text/translate/stream',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
