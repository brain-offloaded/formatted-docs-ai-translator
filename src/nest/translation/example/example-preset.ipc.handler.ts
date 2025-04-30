import { Injectable, NotFoundException } from '@nestjs/common'; // NotFoundException 추가
import { IpcMainInvokeEvent } from 'electron';

import { errorToString } from '../../../utils/error-stringify';
import { IpcHandler, HandleIpc } from '../../common/ipc.handler';
import { IpcChannel } from '../../common/ipc.channel';
import { LoggerService } from '../../logger/logger.service';
import { ExampleManagerService } from './services/example-manager.service';
// DTO import
import { ExamplePresetDto } from './dto/example-preset.dto';
import { ExamplePresetDetailDto } from './dto/example-preset-detail.dto';
import { GetExamplePresetDetailRequestDto } from './dto/request/get-example-preset-detail-request.dto';
import { CreateExamplePresetRequestDto } from './dto/request/create-example-preset-request.dto';
import { UpdateExamplePresetRequestDto } from './dto/request/update-example-preset-request.dto';
import { DeleteExamplePresetRequestDto } from './dto/request/delete-example-preset-request.dto';
import { LoadExamplePresetRequestDto } from './dto/request/load-example-preset-request.dto';
import { GetExamplePresetsResponseDto } from './dto/response/get-example-presets-response.dto';
import { GetExamplePresetDetailResponseDto } from './dto/response/get-example-preset-detail-response.dto';
import { CreateExamplePresetResponseDto } from './dto/response/create-example-preset-response.dto';
import { UpdateExamplePresetResponseDto } from './dto/response/update-example-preset-response.dto';
import { DeleteExamplePresetResponseDto } from './dto/response/delete-example-preset-response.dto';
import { LoadExamplePresetResponseDto } from './dto/response/load-example-preset-response.dto';

@Injectable()
export class ExamplePresetIpcHandler extends IpcHandler {
  constructor(
    private readonly exampleManagerService: ExampleManagerService,
    protected readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.GetExamplePresets)
  async getExamplePresets(): Promise<GetExamplePresetsResponseDto> {
    try {
      const presets = await this.exampleManagerService.getAllPresets();
      const currentPresetName = this.exampleManagerService.getCurrentPresetName();

      const presetDtos: ExamplePresetDto[] = presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description, // description 추가
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
      } as GetExamplePresetsResponseDto;
    }
  }

  @HandleIpc(IpcChannel.GetExamplePresetDetail)
  async getExamplePresetDetail(
    event: IpcMainInvokeEvent,
    { id }: GetExamplePresetDetailRequestDto // id 사용
  ): Promise<GetExamplePresetDetailResponseDto> {
    try {
      const preset = await this.exampleManagerService.getPresetById(id); // getPresetById 사용

      const presetDetailDto: ExamplePresetDetailDto = {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        examples: preset.getExamples(),
      };

      return {
        success: true,
        preset: presetDetailDto,
        message: '예제 프리셋 상세 정보를 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 상세 정보 가져오기 중 오류 발생:', {
        error: errorToString(error),
        presetId: id,
      });
      const message =
        error instanceof NotFoundException
          ? error.message
          : error instanceof Error
            ? `오류: ${error.message}`
            : '알 수 없는 오류가 발생했습니다.';
      return { success: false, message } as GetExamplePresetDetailResponseDto;
    }
  }

  @HandleIpc(IpcChannel.LoadExamplePreset)
  async loadExamplePreset(
    event: IpcMainInvokeEvent,
    { name }: LoadExamplePresetRequestDto
  ): Promise<LoadExamplePresetResponseDto> {
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
      } as LoadExamplePresetResponseDto;
    }
  }

  @HandleIpc(IpcChannel.CreateExamplePreset)
  async createExamplePreset(
    event: IpcMainInvokeEvent,
    dto: CreateExamplePresetRequestDto
  ): Promise<CreateExamplePresetResponseDto> {
    try {
      const { name, description, examples } = dto; // dto 분해 할당
      const preset = await this.exampleManagerService.createPreset(name, description, examples);
      // 생성된 프리셋 정보 반환 (ExamplePresetDto 사용)
      const presetDto: ExamplePresetDto = {
        id: preset.id,
        name: preset.name,
        description: preset.description,
      };

      return {
        success: true,
        preset: presetDto, // ExamplePresetDto 반환
        message: '예제 프리셋이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 생성 중 오류 발생:', {
        error: errorToString(error),
        presetName: dto.name, // dto.name 사용
      });
      const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      return { success: false, message } as CreateExamplePresetResponseDto;
    }
  }

  @HandleIpc(IpcChannel.DeleteExamplePreset)
  async deleteExamplePreset(
    event: IpcMainInvokeEvent,
    { id }: DeleteExamplePresetRequestDto
  ): Promise<DeleteExamplePresetResponseDto> {
    try {
      const success = await this.exampleManagerService.deletePreset(id);

      if (!success) {
        // 서비스에서 NotFoundException을 던지지 않고 false를 반환하는 경우 처리
        return {
          success: false,
          message: '프리셋을 찾을 수 없거나 삭제할 수 없습니다.',
        };
      }

      return {
        success: true,
        message: '예제 프리셋이 성공적으로 삭제되었습니다.',
      };
    } catch (error) {
      this.logger.error('예제 프리셋 삭제 중 오류 발생:', {
        error: errorToString(error),
        presetId: id,
      });
      const message =
        error instanceof NotFoundException // 서비스에서 NotFoundException을 던지는 경우 처리
          ? error.message
          : error instanceof Error
            ? `오류: ${error.message}`
            : '알 수 없는 오류가 발생했습니다.';
      return { success: false, message } as DeleteExamplePresetResponseDto;
    }
  }

  @HandleIpc(IpcChannel.UpdateExamplePreset)
  async updateExamplePreset(
    event: IpcMainInvokeEvent,
    dto: UpdateExamplePresetRequestDto
  ): Promise<UpdateExamplePresetResponseDto> {
    try {
      const { id, examples, description, name } = dto;
      const { success, message } = await this.exampleManagerService.updatePresetExamples(
        id,
        examples,
        description,
        name
      );

      if (!success) {
        return {
          success: false,
          message, // 서비스에서 반환된 메시지 사용
        };
      }

      // 업데이트 성공 시 업데이트된 프리셋 정보 반환 (선택적)
      // const updatedPreset = await this.exampleManagerService.getPresetById(id);
      // const presetDto: ExamplePresetDto = { ... };

      return {
        success: true,
        message, // 서비스에서 반환된 메시지 사용
        // preset: presetDto // 필요시 업데이트된 정보 반환
      };
    } catch (error) {
      this.logger.error('예제 프리셋 업데이트 중 오류 발생:', {
        error: errorToString(error),
        presetId: dto.id, // dto.id 사용
        newName: dto.name, // dto.name 사용
      });
      const message =
        error instanceof NotFoundException
          ? error.message
          : error instanceof Error
            ? error.message // 서비스에서 던진 오류 메시지 사용
            : '알 수 없는 오류가 발생했습니다.';
      return { success: false, message } as UpdateExamplePresetResponseDto;
    }
  }
}
