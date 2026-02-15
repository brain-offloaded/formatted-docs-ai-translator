import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { PromptPresetManagerService } from './services/prompt-preset-manager.service';
import { LoggerService } from '../../logger/logger.service';
import { errorToString } from '@/nest/utils/error-stringify';
import { GetPromptPresetsRequestDto } from './dto/request/get-prompt-presets-request.dto';
import { CreatePromptPresetRequestDto } from './dto/request/create-prompt-preset.dto';
import { UpdatePromptPresetBodyDto } from './dto/request/update-prompt-preset-body.dto';
import { GetPromptPresetsResponseDto } from './dto/response/get-prompt-presets.response.dto';
import { GetPromptPresetDetailResponseDto } from './dto/response/get-prompt-preset-detail.response.dto';
import { CreatePromptPresetResponseDto } from './dto/response/create-prompt-preset.response.dto';
import { UpdatePromptPresetResponseDto } from './dto/response/update-prompt-preset.response.dto';
import { DeletePromptPresetResponseDto } from './dto/response/delete-prompt-preset.response.dto';
import { PromptPresetDto } from './dto/prompt-preset.dto';
import { PromptPresetDetailDto } from './dto/prompt-preset-detail.dto';
import { PromptPresetType } from './types/prompt-preset';
import {
  appendLegacyWarningMessage,
  containsLegacyTranslatedTextKey,
} from './utils/legacy-translated-text';

@ApiTags('prompt-presets')
@Controller('prompt-presets')
export class PromptPresetController {
  constructor(
    private readonly promptPresetManagerService: PromptPresetManagerService,
    private readonly logger: LoggerService
  ) {}

  private withLegacyWarningMessage({
    baseMessage,
    type,
    prompt,
  }: {
    baseMessage: string;
    type: PromptPresetType;
    prompt: string;
  }): string {
    if (type !== PromptPresetType.TEXT || !containsLegacyTranslatedTextKey(prompt)) {
      return baseMessage;
    }
    return appendLegacyWarningMessage(baseMessage);
  }

  @Get()
  @ApiOkResponse({
    description: '프롬프트 프리셋 목록을 조회합니다.',
    type: GetPromptPresetsResponseDto,
  })
  @SerializeOptions({ type: GetPromptPresetsResponseDto })
  async getPromptPresets(
    @Query() dto: GetPromptPresetsRequestDto
  ): Promise<GetPromptPresetsResponseDto> {
    try {
      const presets = await this.promptPresetManagerService.getAllPresets(dto?.type);
      const presetDtos: PromptPresetDto[] = presets.map((preset) =>
        PromptPresetDto.fromEntity(preset)
      );
      const hasLegacyTextPrompt = presetDtos.some(
        (preset) => preset.type === PromptPresetType.TEXT && preset.containsLegacyTranslatedText
      );

      return {
        success: true,
        presets: presetDtos,
        message: hasLegacyTextPrompt
          ? appendLegacyWarningMessage('프롬프트 프리셋 목록을 성공적으로 가져왔습니다.')
          : '프롬프트 프리셋 목록을 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 목록 가져오기 중 오류 발생:', {
        error: errorToString(error),
      });
      return {
        success: false,
        presets: [],
        message:
          error instanceof Error ? `오류: ${error.message}` : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @Get(':id')
  @ApiOkResponse({
    description: '프롬프트 프리셋 상세 정보를 조회합니다.',
    type: GetPromptPresetDetailResponseDto,
  })
  @SerializeOptions({ type: GetPromptPresetDetailResponseDto })
  async getPromptPresetDetail(
    @Param('id', ParseIntPipe) id: number
  ): Promise<GetPromptPresetDetailResponseDto> {
    try {
      const preset = await this.promptPresetManagerService.getPresetById(id);
      const presetDetailDto: PromptPresetDetailDto = {
        id: preset.id,
        name: preset.name,
        prompt: preset.prompt,
        type: preset.type,
        containsLegacyTranslatedText: containsLegacyTranslatedTextKey(preset.prompt),
      };

      return {
        success: true,
        preset: presetDetailDto,
        message: this.withLegacyWarningMessage({
          baseMessage: '프롬프트 프리셋 상세 정보를 성공적으로 가져왔습니다.',
          type: preset.type,
          prompt: preset.prompt,
        }),
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
      return { success: false, message };
    }
  }

  @Post()
  @ApiOkResponse({
    description: '프롬프트 프리셋을 생성합니다.',
    type: CreatePromptPresetResponseDto,
  })
  @SerializeOptions({ type: CreatePromptPresetResponseDto })
  async createPromptPreset(
    @Body() dto: CreatePromptPresetRequestDto
  ): Promise<CreatePromptPresetResponseDto> {
    try {
      const newPreset = await this.promptPresetManagerService.createPreset(dto);
      const presetDto: PromptPresetDto = PromptPresetDto.fromEntity(newPreset);
      return {
        success: true,
        preset: presetDto,
        message: this.withLegacyWarningMessage({
          baseMessage: '프롬프트 프리셋이 성공적으로 생성되었습니다.',
          type: newPreset.type,
          prompt: newPreset.prompt,
        }),
      };
    } catch (error) {
      this.logger.error('프롬프트 프리셋 생성 중 오류 발생:', {
        error: errorToString(error),
        dto,
      });
      const message =
        error instanceof Error ? error.message : '프롬프트 프리셋 생성 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  }

  @Patch(':id')
  @ApiOkResponse({
    description: '프롬프트 프리셋을 업데이트합니다.',
    type: UpdatePromptPresetResponseDto,
  })
  @SerializeOptions({ type: UpdatePromptPresetResponseDto })
  async updatePromptPreset(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromptPresetBodyDto
  ): Promise<UpdatePromptPresetResponseDto> {
    try {
      const updatedPreset = await this.promptPresetManagerService.updatePreset({
        ...dto,
        id,
      });
      const presetDto: PromptPresetDto = PromptPresetDto.fromEntity(updatedPreset);
      return {
        success: true,
        preset: presetDto,
        message: this.withLegacyWarningMessage({
          baseMessage: '프롬프트 프리셋이 성공적으로 업데이트되었습니다.',
          type: updatedPreset.type,
          prompt: updatedPreset.prompt,
        }),
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
            ? error.message
            : '프롬프트 프리셋 업데이트 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  }

  @Delete(':id')
  @ApiOkResponse({
    description: '프롬프트 프리셋을 삭제합니다.',
    type: DeletePromptPresetResponseDto,
  })
  @SerializeOptions({ type: DeletePromptPresetResponseDto })
  async deletePromptPreset(
    @Param('id', ParseIntPipe) id: number
  ): Promise<DeletePromptPresetResponseDto> {
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
      };
    }
  }
}
