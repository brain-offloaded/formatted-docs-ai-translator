/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PromptPresetDetailDto = {
    /**
     * 프롬프트 프리셋 ID
     */
    id: number;
    /**
     * 프롬프트 프리셋 이름
     */
    name: string;
    /**
     * 프롬프트 내용
     */
    prompt: string;
    /**
     * 프롬프트 프리셋 타입
     */
    type: PromptPresetDetailDto.type;
};
export namespace PromptPresetDetailDto {
    /**
     * 프롬프트 프리셋 타입
     */
    export enum type {
        TEXT = 'text',
        IMAGE = 'image',
    }
}

