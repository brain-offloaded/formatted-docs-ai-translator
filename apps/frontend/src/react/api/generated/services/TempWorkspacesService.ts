/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteTempWorkspaceResponseDto } from '../models/DeleteTempWorkspaceResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TempWorkspacesService {
    /**
     * @returns DeleteTempWorkspaceResponseDto 임시 작업 공간을 정리합니다.
     * @throws ApiError
     */
    public static tempWorkspaceControllerDeleteTempWorkspace({
        workspaceId,
    }: {
        /**
         * 정리할 임시 작업 공간 ID
         */
        workspaceId: string,
    }): CancelablePromise<DeleteTempWorkspaceResponseDto> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/temp-workspaces/{workspaceId}',
            path: {
                'workspaceId': workspaceId,
            },
        });
    }
}
