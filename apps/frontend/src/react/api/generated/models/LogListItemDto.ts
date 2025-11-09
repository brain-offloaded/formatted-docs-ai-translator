/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LogListItemDto = {
    /**
     * 로그 ID
     */
    id: number;
    /**
     * 로그 레벨
     */
    level: string;
    /**
     * 로그 메시지
     */
    message: string;
    /**
     * 로그 컨텍스트
     */
    context?: string | null;
    /**
     * 메타데이터 미리보기 문자열
     */
    metadataPreview?: string | null;
    /**
     * 메타데이터 존재 여부
     */
    hasMetadata: boolean;
    /**
     * 로그 발생 시각 (ISO 문자열)
     */
    timestamp: string;
};

