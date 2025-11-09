/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DeleteCacheTagBodyDto = {
    /**
     * 삭제 모드
     */
    mode?: DeleteCacheTagBodyDto.mode;
    /**
     * 재할당 대상 캐시 태그 ID (mode가 reassign일 경우 필수)
     */
    targetTagId?: number;
};
export namespace DeleteCacheTagBodyDto {
    /**
     * 삭제 모드
     */
    export enum mode {
        STRICT = 'strict',
        CASCADE = 'cascade',
        REASSIGN = 'reassign',
    }
}

