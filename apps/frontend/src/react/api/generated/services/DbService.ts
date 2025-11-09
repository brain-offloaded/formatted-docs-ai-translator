/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetDbPathResponseDto } from '../models/GetDbPathResponseDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DbService {
    /**
     * @returns GetDbPathResponseDto Returns the path to the database file.
     * @throws ApiError
     */
    public static dbControllerGetDbPath(): CancelablePromise<GetDbPathResponseDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/db/path',
        });
    }
}
