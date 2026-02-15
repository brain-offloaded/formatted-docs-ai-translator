/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PlaceholderPreservationRuleDto } from './PlaceholderPreservationRuleDto';
export type PlaceholderPreservationSettingsDto = {
    /**
     * 플레이스홀더 보존 검사 활성화 여부
     */
    enabled: boolean;
    /**
     * 플레이스홀더 보존 검사 규칙 목록
     */
    rules?: Array<PlaceholderPreservationRuleDto>;
};

