import { Injectable } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { errorToString } from '../../../utils/error-stringify';
import { IpcHandler, HandleIpc } from '../../common/ipc.handler';
import { IpcChannel } from '../../common/ipc.channel';
import { LoggerService } from '../../logger/logger.service';
import { ExampleManagerService } from './services/example-manager.service';
import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../../types/electron';
import { ExamplePresetDto } from '@/nest/translation/example/dto/example-preset.dto';
@Injectable()
export class ExamplePresetIpcHandler extends IpcHandler {
  constructor(
    private readonly exampleManagerService: ExampleManagerService,
    private readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.GetExamplePresets)
  async getExamplePresets(): Promise<InvokeFunctionResponse<IpcChannel.GetExamplePresets>> {
    try {
      const presets = await this.exampleManagerService.getAllPresets();
      const currentPresetName = this.exampleManagerService.getCurrentPresetName();

      const presetDtos: ExamplePresetDto[] = presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
      }));

      return {
        success: true,
        presets: presetDtos,
        currentPreset: currentPresetName,
        message: '예제 프리셋 목록을 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 목록 가져오기 중 오류 발생:', {
        error: errorToString(error),
      });

      return {
        success: false,
        presets: [],
        currentPreset: '',
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @HandleIpc(IpcChannel.GetExamplePresetDetail)
  async getExamplePresetDetail(
    event: IpcMainInvokeEvent,
    { name }: InvokeFunctionRequest<IpcChannel.GetExamplePresetDetail>
  ): Promise<InvokeFunctionResponse<IpcChannel.GetExamplePresetDetail>> {
    try {
      const preset = await this.exampleManagerService.getPresetByName(name);

      if (!preset) {
        return {
          success: false,
          message: `'${name}' 프리셋을 찾을 수 없습니다.`,
        };
      }

      const examples = preset.getExamples();

      return {
        success: true,
        preset: {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          examples,
        },
        message: '예제 프리셋 상세 정보를 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 상세 정보 가져오기 중 오류 발생:', {
        error: errorToString(error),
        presetName: name,
      });

      return {
        success: false,
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @HandleIpc(IpcChannel.LoadExamplePreset)
  async loadExamplePreset(
    event: IpcMainInvokeEvent,
    { name }: InvokeFunctionRequest<IpcChannel.LoadExamplePreset>
  ): Promise<InvokeFunctionResponse<IpcChannel.LoadExamplePreset>> {
    try {
      const success = await this.exampleManagerService.loadExamplePreset(name);

      if (!success) {
        return {
          success: false,
          message: `'${name}' 프리셋을 찾을 수 없거나 로드할 수 없습니다.`,
        };
      }

      return {
        success: true,
        message: '예제 프리셋을 성공적으로 로드했습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 로드 중 오류 발생:', {
        error: errorToString(error),
        presetName: name,
      });

      return {
        success: false,
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @HandleIpc(IpcChannel.CreateExamplePreset)
  async createExamplePreset(
    event: IpcMainInvokeEvent,
    { name, description, examples }: InvokeFunctionRequest<IpcChannel.CreateExamplePreset>
  ): Promise<InvokeFunctionResponse<IpcChannel.CreateExamplePreset>> {
    try {
      // 예제가 제공된 경우 복제, 아니면 빈 예제로 새 프리셋 생성
      const preset = await this.exampleManagerService.createPreset(
        name,
        description,
        examples // 예제가 제공되면 복제, 아니면 빈 예제 사용
      );

      return {
        success: true,
        preset,
        message: '예제 프리셋이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 생성 중 오류 발생:', {
        error: errorToString(error),
        presetName: name,
      });

      // 이미 존재하는 이름인 경우 특별한 메시지 제공
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return {
          success: false,
          message: `'${name}' 이름의 프리셋이 이미 존재합니다. 다른 이름을 사용해주세요.`,
        };
      }

      return {
        success: false,
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @HandleIpc(IpcChannel.DeleteExamplePreset)
  async deleteExamplePreset(
    event: IpcMainInvokeEvent,
    { id }: InvokeFunctionRequest<IpcChannel.DeleteExamplePreset>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteExamplePreset>> {
    try {
      const success = await this.exampleManagerService.deletePreset(id);

      if (!success) {
        return {
          success: false,
          message: '프리셋을 찾을 수 없거나 삭제할 수 없습니다.',
        };
      }

      return {
        success: true,
        message: '프리셋이 성공적으로 삭제되었습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 삭제 중 오류 발생:', {
        error: errorToString(error),
        presetId: id,
      });

      return {
        success: false,
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @HandleIpc(IpcChannel.UpdateExamplePreset)
  async updateExamplePreset(
    event: IpcMainInvokeEvent,
    { id, examples, description, name }: InvokeFunctionRequest<IpcChannel.UpdateExamplePreset>
  ): Promise<InvokeFunctionResponse<IpcChannel.UpdateExamplePreset>> {
    try {
      const { success, message } = await this.exampleManagerService.updatePresetExamples(
        id,
        examples,
        description,
        name
      );

      if (!success) {
        return {
          success: false,
          message,
        };
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      this.logger.error('예제 프리셋 업데이트 중 오류 발생:', {
        error: errorToString(error),
        presetId: id,
        newName: name,
      });

      return {
        success: false,
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }
}
