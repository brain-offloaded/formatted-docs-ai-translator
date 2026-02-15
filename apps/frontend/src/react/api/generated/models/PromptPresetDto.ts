/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PromptPresetDto = {
    /**
     * 프롬프트 프리셋 ID
     */
    id: number;
    /**
     * 프롬프트 프리셋 이름
     */
    name: string;
    /**
     * 프롬프트 프리셋 타입
     */
    type: PromptPresetDto.type;
    /**
     * 프롬프트에 legacy translated_text 키가 포함되어 있는지 여부
     */
    containsLegacyTranslatedText: boolean;
};
export namespace PromptPresetDto {
    /**
     * 프롬프트 프리셋 타입
     */
    export enum type {
        TEXT = 'text',
        IMAGE = 'image',
    }
}

