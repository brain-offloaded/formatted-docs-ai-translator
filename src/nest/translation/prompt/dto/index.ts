import { IpcChannel } from '../../../common/ipc.channel';
import * as RequestDto from './request';
import * as ResponseDto from './response';

// 기본 DTO들도 export
export * from './prompt-preset.dto';
export * from './prompt-preset-detail.dto';

// 요청/응답 DTO export
export * from './request';
export * from './response';

// IPC 채널과 요청/응답 DTO 매핑 정의
export type PromptPresetRequestResponse = {
  [IpcChannel.GetPromptPresets]: {
    Request: never; // 요청 파라미터 없음
    Response: ResponseDto.GetPromptPresetsResponseDto;
  };
  [IpcChannel.GetPromptPresetDetail]: {
    Request: RequestDto.GetPromptPresetDetailRequestDto;
    Response: ResponseDto.GetPromptPresetDetailResponseDto;
  };
  [IpcChannel.CreatePromptPreset]: {
    Request: RequestDto.CreatePromptPresetRequestDto;
    Response: ResponseDto.CreatePromptPresetResponseDto;
  };
  [IpcChannel.UpdatePromptPreset]: {
    Request: RequestDto.UpdatePromptPresetRequestDto;
    Response: ResponseDto.UpdatePromptPresetResponseDto;
  };
  [IpcChannel.DeletePromptPreset]: {
    Request: RequestDto.DeletePromptPresetRequestDto;
    Response: ResponseDto.DeletePromptPresetResponseDto;
  };
};
