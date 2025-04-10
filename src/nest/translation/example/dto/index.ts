import { IpcChannel } from '@/nest/common/ipc.channel';
import { CreateExamplePresetResponseDto } from './response/create-example-preset-response.dto';
import { CreateExamplePresetRequestDto } from './request/create-example-preset-request.dto';
import { GetExamplePresetsResponseDto } from './response/get-example-presets-response.dto';
import { DeleteExamplePresetRequestDto } from './request/delete-example-preset-request.dto';
import { DeleteExamplePresetResponseDto } from './response/delete-example-preset-response.dto';
import { GetExamplePresetDetailRequestDto } from './request/get-example-preset-detail-request.dto';
import { GetExamplePresetDetailResponseDto } from './response/get-example-preset-detail-response.dto';
import { UpdateExamplePresetRequestDto } from './request/update-example-preset-request.dto';
import { UpdateExamplePresetResponseDto } from './response/update-example-preset-response.dto';
import { LoadExamplePresetRequestDto } from './request/load-example-preset-request.dto';
import { LoadExamplePresetResponseDto } from './response/load-example-preset-response.dto';

export class ExamplePresetRequestResponse {
  [IpcChannel.CreateExamplePreset]: {
    Request: CreateExamplePresetRequestDto;
    Response: CreateExamplePresetResponseDto;
  };
  [IpcChannel.DeleteExamplePreset]: {
    Request: DeleteExamplePresetRequestDto;
    Response: DeleteExamplePresetResponseDto;
  };
  [IpcChannel.GetExamplePresets]: {
    Request: never;
    Response: GetExamplePresetsResponseDto;
  };
  [IpcChannel.GetExamplePresetDetail]: {
    Request: GetExamplePresetDetailRequestDto;
    Response: GetExamplePresetDetailResponseDto;
  };
  [IpcChannel.UpdateExamplePreset]: {
    Request: UpdateExamplePresetRequestDto;
    Response: UpdateExamplePresetResponseDto;
  };
  [IpcChannel.LoadExamplePreset]: {
    Request: LoadExamplePresetRequestDto;
    Response: LoadExamplePresetResponseDto;
  };
}
