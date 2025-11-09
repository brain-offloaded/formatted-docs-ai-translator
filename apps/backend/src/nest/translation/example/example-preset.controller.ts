import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ExampleManagerService } from './services/example-manager.service';
import { LoggerService } from '../../logger/logger.service';
import { GetExamplePresetsResponseDto } from './dto/response/get-example-presets-response.dto';
import { ExamplePresetDto } from './dto/example-preset.dto';
import { GetExamplePresetDetailResponseDto } from './dto/response/get-example-preset-detail-response.dto';
import { ExamplePresetIdParamDto } from './dto/request/example-preset-id-param.dto';
import { ExamplePresetDetailDto } from './dto/example-preset-detail.dto';
import { LoadExamplePresetRequestDto } from './dto/request/load-example-preset-request.dto';
import { LoadExamplePresetResponseDto } from './dto/response/load-example-preset-response.dto';
import { CreateExamplePresetRequestDto } from './dto/request/create-example-preset-request.dto';
import { CreateExamplePresetResponseDto } from './dto/response/create-example-preset-response.dto';
import { DeleteExamplePresetResponseDto } from './dto/response/delete-example-preset-response.dto';
import { UpdateExamplePresetRequestDto } from './dto/request/update-example-preset-request.dto';
import { UpdateExamplePresetResponseDto } from './dto/response/update-example-preset-response.dto';
import type { TargetLanguage } from '@apps/common/dist/language';
import { ExamplePresetExamplesQueryDto } from './dto/request/example-preset-examples-query.dto';
import { GetExamplePresetExamplesResponseDto } from './dto/response/get-example-preset-examples-response.dto';
import { ExamplePresetExampleLineDto } from './dto/example-preset-example-line.dto';

@ApiTags('example-presets')
@Controller('example-presets')
export class ExamplePresetController {
  constructor(
    private readonly exampleManagerService: ExampleManagerService,
    private readonly logger: LoggerService
  ) {}

  @Get()
  @ApiOkResponse({
    description: '예제 프리셋 목록을 조회합니다.',
    type: GetExamplePresetsResponseDto,
  })
  @SerializeOptions({ type: GetExamplePresetsResponseDto })
  async getExamplePresets(): Promise<GetExamplePresetsResponseDto> {
    const presets = await this.exampleManagerService.getAllPresets();
    const currentPresetName = this.exampleManagerService.getCurrentPresetName();

    const presetDtos: ExamplePresetDto[] = presets.map((preset) => {
      const examples = this.exampleManagerService.extractExamples(preset);
      const languages = Object.keys(examples) as TargetLanguage[];

      return {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        languages,
      };
    });

    return {
      success: true,
      presets: presetDtos,
      currentPreset: currentPresetName,
      message: '예제 프리셋 목록을 성공적으로 가져왔습니다.',
    };
  }

  @Get(':id')
  @ApiOkResponse({
    description: '예제 프리셋 상세 정보를 조회합니다.',
    type: GetExamplePresetDetailResponseDto,
  })
  @SerializeOptions({ type: GetExamplePresetDetailResponseDto })
  async getExamplePresetDetail(
    @Param() { id }: ExamplePresetIdParamDto
  ): Promise<GetExamplePresetDetailResponseDto> {
    const preset = await this.exampleManagerService.getPresetById(id);

    const examples = this.exampleManagerService.extractExamples(preset) ?? {};
    const presetDetailDto: ExamplePresetDetailDto = {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      languages: Object.keys(examples) as TargetLanguage[],
    };

    return {
      success: true,
      preset: presetDetailDto,
      message: '예제 프리셋 상세 정보를 성공적으로 가져왔습니다.',
    };
  }

  @Get(':id/examples')
  @ApiOkResponse({
    description: '특정 언어 쌍에 대한 예제 문장을 조회합니다.',
    type: GetExamplePresetExamplesResponseDto,
  })
  @SerializeOptions({ type: GetExamplePresetExamplesResponseDto })
  async getExamplePresetExamples(
    @Param() { id }: ExamplePresetIdParamDto,
    @Query() { sourceLanguage, targetLanguage }: ExamplePresetExamplesQueryDto
  ): Promise<GetExamplePresetExamplesResponseDto> {
    const examplePair = await this.exampleManagerService.getPresetExamplePair(
      id,
      sourceLanguage,
      targetLanguage
    );

    const maxLength = Math.max(examplePair.sourceLines.length, examplePair.resultLines.length);
    const examples: ExamplePresetExampleLineDto[] = Array.from({ length: maxLength }).map(
      (_, index) => ({
        sourceText: examplePair.sourceLines[index] ?? '',
        resultText: examplePair.resultLines[index] ?? '',
      })
    );

    return {
      success: true,
      sourceLanguage,
      targetLanguage,
      examples,
      message: '예제 문장을 성공적으로 가져왔습니다.',
    };
  }

  @Post('load')
  @ApiOkResponse({
    description: '예제 프리셋을 로드합니다.',
    type: LoadExamplePresetResponseDto,
  })
  @SerializeOptions({ type: LoadExamplePresetResponseDto })
  async loadExamplePreset(
    @Body() { name }: LoadExamplePresetRequestDto
  ): Promise<LoadExamplePresetResponseDto> {
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
  }

  @Post()
  @ApiOkResponse({
    description: '예제 프리셋을 생성합니다.',
    type: CreateExamplePresetResponseDto,
  })
  @SerializeOptions({ type: CreateExamplePresetResponseDto })
  async createExamplePreset(
    @Body() dto: CreateExamplePresetRequestDto
  ): Promise<CreateExamplePresetResponseDto> {
    const { name, description, examples: requestExamples } = dto;
    const preset = await this.exampleManagerService.createPreset(
      name,
      description,
      requestExamples
    );

    const presetExamples = this.exampleManagerService.extractExamples(preset);
    const presetDto: ExamplePresetDto = {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      languages: Object.keys(presetExamples || {}) as TargetLanguage[],
    };

    return {
      success: true,
      preset: presetDto,
      message: '예제 프리셋이 성공적으로 생성되었습니다.',
    };
  }

  @Delete(':id')
  @ApiOkResponse({
    description: '예제 프리셋을 삭제합니다.',
    type: DeleteExamplePresetResponseDto,
  })
  @SerializeOptions({ type: DeleteExamplePresetResponseDto })
  async deleteExamplePreset(
    @Param() { id }: ExamplePresetIdParamDto
  ): Promise<DeleteExamplePresetResponseDto> {
    await this.exampleManagerService.deletePreset(id);

    return {
      success: true,
      message: '예제 프리셋이 성공적으로 삭제되었습니다.',
    };
  }

  @Patch(':id')
  @ApiOkResponse({
    description: '예제 프리셋을 수정합니다.',
    type: UpdateExamplePresetResponseDto,
  })
  @SerializeOptions({ type: UpdateExamplePresetResponseDto })
  async updateExamplePreset(
    @Param() { id }: ExamplePresetIdParamDto,
    @Body() dto: UpdateExamplePresetRequestDto
  ): Promise<UpdateExamplePresetResponseDto> {
    const { success, message } = await this.exampleManagerService.updatePresetExamples(
      id,
      dto.examples,
      dto.description,
      dto.name
    );

    return {
      success,
      message,
    };
  }
}
