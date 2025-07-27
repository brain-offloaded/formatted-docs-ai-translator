import { Injectable, NotFoundException } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { errorToString } from '../../../utils/error-stringify';
import { IpcHandler, HandleIpc } from '../../common/ipc.handler';
import { IpcChannel } from '../../common/ipc.channel';
import { LoggerService } from '../../logger/logger.service';
import { PromptPresetManagerService } from './services/prompt-preset-manager.service';
// import { InvokeFunctionResponse } from '../../../types/electron'; // 더 이상 사용하지 않음
import { PromptPresetDto } from './dto/prompt-preset.dto';
import { PromptPresetDetailDto } from './dto/prompt-preset-detail.dto';
import { CreatePromptPresetRequestDto } from './dto/request/create-prompt-preset.dto';
import { UpdatePromptPresetRequestDto } from './dto/request/update-prompt-preset.dto';
import { DeletePromptPresetRequestDto } from './dto/request/delete-prompt-preset.dto';
import { GetPromptPresetDetailRequestDto } from './dto/request/get-prompt-preset-detail.dto';
// 응답 DTO import 추가
import { GetPromptPresetsResponseDto } from './dto/response/get-prompt-presets.response.dto';
import { GetPromptPresetDetailResponseDto } from './dto/response/get-prompt-preset-detail.response.dto';
import { CreatePromptPresetResponseDto } from './dto/response/create-prompt-preset.response.dto';
import { UpdatePromptPresetResponseDto } from './dto/response/update-prompt-preset.response.dto';
import { DeletePromptPresetResponseDto } from './dto/response/delete-prompt-preset.response.dto';

@Injectable()
export class PromptPresetIpcHandler extends IpcHandler {
  constructor(
    private readonly promptPresetManagerService: PromptPresetManagerService,
    protected readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.GetPromptPresets)
  async getPromptPresets(): Promise<GetPromptPresetsResponseDto> {
    // 반환 타입 수정
    try {
      const presets = await this.promptPresetManagerService.getAllPresets();
      const presetDtos: PromptPresetDto[] = presets.map((preset) => ({
        id: preset.id,
        name: preset.name,
      }));

      return {
        success: true,
        presets: presetDtos,
        message: '프롬프트 프리셋 목록을 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 목록 가져오기 중 오류 발생:', {
        error: errorToString(error),
      });
      return {
        success: false,
        presets: [], // 빈 배열 반환
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      } as GetPromptPresetsResponseDto; // 타입 단언 위치 수정
    }
  }

  @HandleIpc(IpcChannel.GetPromptPresetDetail)
  async getPromptPresetDetail(
    event: IpcMainInvokeEvent,
    { id }: GetPromptPresetDetailRequestDto // DTO 타입 사용
  ): Promise<GetPromptPresetDetailResponseDto> {
    // 반환 타입 수정
    try {
      const preset = await this.promptPresetManagerService.getPresetById(id);
      const presetDetailDto: PromptPresetDetailDto = {
        id: preset.id,
        name: preset.name,
        prompt: preset.prompt,
      };

      return {
        success: true,
        preset: presetDetailDto,
        message: '프롬프트 프리셋 상세 정보를 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 상세 정보 가져오기 중 오류 발생:', {
        error: errorToString(error),
        presetId: id,
      });
      const message =
        error instanceof NotFoundException
          ? error.message
          : error instanceof Error
            ? `오류: ${error.message}`
            : '알 수 없는 오류가 발생했습니다.';
      return { success: false, message } as GetPromptPresetDetailResponseDto; // 타입 단언 위치 수정
    }
  }

  @HandleIpc(IpcChannel.CreatePromptPreset)
  async createPromptPreset(
    event: IpcMainInvokeEvent,
    dto: CreatePromptPresetRequestDto
  ): Promise<CreatePromptPresetResponseDto> {
    // 반환 타입 수정
    try {
      const newPreset = await this.promptPresetManagerService.createPreset(dto);
      const presetDto: PromptPresetDto = {
        id: newPreset.id,
        name: newPreset.name,
      };
      return {
        success: true,
        preset: presetDto,
        message: '프롬프트 프리셋이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 생성 중 오류 발생:', {
        error: errorToString(error),
        dto,
      });
      // 서비스에서 던진 특정 오류 메시지 사용
      const message =
        error instanceof Error ? error.message : '프롬프트 프리셋 생성 중 오류가 발생했습니다.';
      return { success: false, message } as CreatePromptPresetResponseDto; // 타입 단언 위치 수정
    }
  }

  @HandleIpc(IpcChannel.UpdatePromptPreset)
  async updatePromptPreset(
    event: IpcMainInvokeEvent,
    dto: UpdatePromptPresetRequestDto
  ): Promise<UpdatePromptPresetResponseDto> {
    // 반환 타입 수정
    try {
      const updatedPreset = await this.promptPresetManagerService.updatePreset(dto);
      const presetDto: PromptPresetDto = {
        id: updatedPreset.id,
        name: updatedPreset.name,
      };
      return {
        success: true,
        preset: presetDto,
        message: '프롬프트 프리셋이 성공적으로 업데이트되었습니다.',
      };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 업데이트 중 오류 발생:', {
        error: errorToString(error),
        dto,
      });
      const message =
        error instanceof NotFoundException
          ? error.message
          : error instanceof Error
            ? error.message // 서비스에서 던진 특정 오류 메시지 (예: 이름 중복)
            : '프롬프트 프리셋 업데이트 중 오류가 발생했습니다.';
      return { success: false, message } as UpdatePromptPresetResponseDto; // 타입 단언 위치 수정
    }
  }

  @HandleIpc(IpcChannel.DeletePromptPreset)
  async deletePromptPreset(
    event: IpcMainInvokeEvent,
    { id }: DeletePromptPresetRequestDto
  ): Promise<DeletePromptPresetResponseDto> {
    // 반환 타입 수정
    try {
      const result = await this.promptPresetManagerService.deletePreset(id);
      if (!result.success) {
        return {
          success: false,
          message: result.message || '프롬프트 프리셋 삭제에 실패했습니다.',
        };
      }
      return { success: true, message: '프롬프트 프리셋이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 삭제 중 오류 발생:', {
        error: errorToString(error),
        presetId: id,
      });
      return {
        success: false,
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      } as DeletePromptPresetResponseDto; // 타입 단언 위치 수정
    }
  }
}
