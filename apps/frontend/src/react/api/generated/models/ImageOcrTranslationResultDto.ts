/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageTextBoundingBoxDto } from './ImageTextBoundingBoxDto';
export type ImageOcrTranslationResultDto = {
    /**
     * OCR 결과 목록
     */
    ocr_result: Array<ImageTextBoundingBoxDto>;
    /**
     * 번역된 텍스트 목록
     */
    translated_result: Array<ImageTextBoundingBoxDto>;
};

