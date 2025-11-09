/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TranslationExportImportDto } from './TranslationExportImportDto';
export type ExportTranslationsResponseDto = {
    /**
     * 요청이 성공했는지 여부
     */
    success: boolean;
    /**
     * 요청 처리 결과 메시지
     */
    message?: string;
    /**
     * 내보낸 번역 목록
     */
    translations: Array<TranslationExportImportDto>;
};

