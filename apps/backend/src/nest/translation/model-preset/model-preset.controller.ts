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
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { LoggerService } from '@/nest/logger/logger.service';
import { errorToString } from '@/nest/utils/error-stringify';
import { ModelPresetManagerService } from './services/model-preset-manager.service';
import { CreateModelPresetRequestDto } from './dto/request/create-model-preset.dto';
import { UpdateModelPresetBodyDto } from './dto/request/update-model-preset-body.dto';
import { GetModelPresetsResponseDto } from './dto/response/get-model-presets.response.dto';
import { GetModelPresetDetailResponseDto } from './dto/response/get-model-preset-detail.response.dto';
import { CreateModelPresetResponseDto } from './dto/response/create-model-preset.response.dto';
import { UpdateModelPresetResponseDto } from './dto/response/update-model-preset.response.dto';
import { DeleteModelPresetResponseDto } from './dto/response/delete-model-preset.response.dto';
import { ModelPresetDto } from './dto/model-preset.dto';

@ApiTags('model-presets')
@Controller('model-presets')
export class ModelPresetController {
  constructor(
    private readonly modelPresetManagerService: ModelPresetManagerService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  @ApiOkResponse({
    description: '모델 프리셋 목록을 조회합니다.',
    type: GetModelPresetsResponseDto,
  })
  @SerializeOptions({ type: GetModelPresetsResponseDto })
  async getModelPresets(): Promise<GetModelPresetsResponseDto> {
    try {
      const presets = await this.modelPresetManagerService.getAllPresets();
      const presetDtos = presets.map((preset) => ModelPresetDto.fromEntity(preset));

      return {
        success: true,
        presets: presetDtos,
        message: '모델 프리셋 목록을 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('모델 프리셋 목록 가져오기 중 오류 발생:', {
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
    description: '모델 프리셋 상세 정보를 조회합니다.',
    type: GetModelPresetDetailResponseDto,
  })
  @SerializeOptions({ type: GetModelPresetDetailResponseDto })
  async getModelPresetDetail(
    @Param('id', ParseIntPipe) id: number
  ): Promise<GetModelPresetDetailResponseDto> {
    try {
      const preset = await this.modelPresetManagerService.getPresetById(id);
      return {
        success: true,
        preset: ModelPresetDto.fromEntity(preset),
        message: '모델 프리셋 상세 정보를 성공적으로 가져왔습니다.',
      };
    } catch (error) {
      this.logger.error('모델 프리셋 상세 정보 가져오기 중 오류 발생:', {
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
    description: '모델 프리셋을 생성합니다.',
    type: CreateModelPresetResponseDto,
  })
  @SerializeOptions({ type: CreateModelPresetResponseDto })
  async createModelPreset(
    @Body() dto: CreateModelPresetRequestDto
  ): Promise<CreateModelPresetResponseDto> {
    try {
      const newPreset = await this.modelPresetManagerService.createPreset(dto);
      return {
        success: true,
        preset: ModelPresetDto.fromEntity(newPreset),
        message: '모델 프리셋이 성공적으로 생성되었습니다.',
      };
    } catch (error) {
      this.logger.error('모델 프리셋 생성 중 오류 발생:', {
        error: errorToString(error),
        dto,
      });
      const message =
        error instanceof Error ? error.message : '모델 프리셋 생성 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  }

  @Patch(':id')
  @ApiOkResponse({
    description: '모델 프리셋을 업데이트합니다.',
    type: UpdateModelPresetResponseDto,
  })
  @SerializeOptions({ type: UpdateModelPresetResponseDto })
  async updateModelPreset(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateModelPresetBodyDto
  ): Promise<UpdateModelPresetResponseDto> {
    try {
      const updatedPreset = await this.modelPresetManagerService.updatePreset(id, dto);
      return {
        success: true,
        preset: ModelPresetDto.fromEntity(updatedPreset),
        message: '모델 프리셋이 성공적으로 업데이트되었습니다.',
      };
    } catch (error) {
      this.logger.error('모델 프리셋 업데이트 중 오류 발생:', {
        error: errorToString(error),
        dto,
      });
      const message =
        error instanceof NotFoundException
          ? error.message
          : error instanceof Error
            ? error.message
            : '모델 프리셋 업데이트 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  }

  @Delete(':id')
  @ApiOkResponse({
    description: '모델 프리셋을 삭제합니다.',
    type: DeleteModelPresetResponseDto,
  })
  @SerializeOptions({ type: DeleteModelPresetResponseDto })
  async deleteModelPreset(
    @Param('id', ParseIntPipe) id: number
  ): Promise<DeleteModelPresetResponseDto> {
    try {
      const result = await this.modelPresetManagerService.deletePreset(id);
      if (!result.success) {
        return {
          success: false,
          message: result.message || '모델 프리셋 삭제에 실패했습니다.',
        };
      }
      return { success: true, message: '모델 프리셋이 성공적으로 삭제되었습니다.' };
    } catch (error) {
      this.logger.error('모델 프리셋 삭제 중 오류 발생:', {
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
