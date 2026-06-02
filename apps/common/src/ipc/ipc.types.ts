/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { IpcChannel } from './ipc-channel';

export interface BaseIpcResponse {
  success: boolean;
  message?: string;
}

export interface OpenExternalUrlRequest {
  url: string;
}

export interface OpenExternalUrlResponse extends BaseIpcResponse {}

export interface ReadTextFileRequest {
  path: string;
}

export interface ReadTextFileResponse extends BaseIpcResponse {
  content?: string;
}

export interface OpenAdvancedViewerRequest {}

export interface OpenAdvancedViewerResponse extends BaseIpcResponse {
  windowId?: number;
}

export interface AdvancedViewerLoadZipRequest {
  zipBuffer?: ArrayBuffer;
  zipBase64?: string;
  zipPath?: string;
  name?: string;
  windowId?: number;
}

export interface AdvancedViewerLoadZipResponse extends BaseIpcResponse {}

export interface OpenZipInAdvancedViewerDialogRequest {}

export interface OpenZipInAdvancedViewerDialogResponse extends BaseIpcResponse {
  selectedPath?: string;
}

export type IpcRequestResponseMap = {
  [IpcChannel.OpenExternalUrl]: {
    Request: OpenExternalUrlRequest;
    Response: OpenExternalUrlResponse;
  };
  [IpcChannel.ReadTextFile]: {
    Request: ReadTextFileRequest;
    Response: ReadTextFileResponse;
  };
  [IpcChannel.OpenAdvancedImageViewer]: {
    Request: OpenAdvancedViewerRequest;
    Response: OpenAdvancedViewerResponse;
  };
  [IpcChannel.AdvancedViewerLoadZip]: {
    Request: AdvancedViewerLoadZipRequest;
    Response: AdvancedViewerLoadZipResponse;
  };
  [IpcChannel.OpenZipInAdvancedViewerDialog]: {
    Request: OpenZipInAdvancedViewerDialogRequest;
    Response: OpenZipInAdvancedViewerDialogResponse;
  };
};

export type IpcRequest<T extends IpcChannel> = T extends keyof IpcRequestResponseMap
  ? IpcRequestResponseMap[T] extends { Request: infer R }
    ? R
    : never
  : never;

export type IpcResponse<T extends IpcChannel> = T extends keyof IpcRequestResponseMap
  ? IpcRequestResponseMap[T] extends { Response: infer R }
    ? R
    : never
  : never;
