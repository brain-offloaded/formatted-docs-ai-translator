import { Injectable } from '@nestjs/common';
import { UnifiedAiTranslatorService } from '../../../ai/services/unified-ai-translator.service';
import { PromptPresetManagerService } from '../../../translation/prompt/services/prompt-preset-manager.service';
import { Box2D } from '@apps/common/dist/utils/box2d';
import sharp from 'sharp';
import { LoggerService } from '@/nest/logger/logger.service';
import { deepClone } from '@/nest/utils/deep-clone';
import { TranslateImageRequestDto } from '../dto/request/translate-image-request.dto';
import {
  ModelProvider,
  TranslatorAiSettings,
} from '@/nest/translator/common/dto/translator-settings.dto';
import { ImageOcrTranslationResultDto } from '../dto/response/translate-image-response.dto';

@Injectable()
export class ImageTranslatorService {
  constructor(
    private readonly unifiedAiTranslator: UnifiedAiTranslatorService,
    private readonly promptPresetManager: PromptPresetManagerService,
    private readonly logger: LoggerService
  ) {}

  async getImageSize(imageBase64: string): Promise<{ width: number; height: number }> {
    const buffer = Buffer.from(imageBase64, 'base64');
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  }

  scaleBboxByWidthHeight({
    box_2d,
    width,
    height,
  }: {
    box_2d: Box2D;
    width: number;
    height: number;
  }): Box2D {
    const { y1, x1, y2, x2 } = Box2D.getCoordinate(box_2d);
    return Box2D.toBox2D({
      x1: Math.round((x1 / 1000) * width),
      y1: Math.round((y1 / 1000) * height),
      x2: Math.round((x2 / 1000) * width),
      y2: Math.round((y2 / 1000) * height),
    });
  }

  async changeBboxByModelProvider(
    result: ImageOcrTranslationResultDto,
    imageData: string,
    aiSettings: TranslatorAiSettings
  ) {
    switch (aiSettings.modelProvider) {
      case ModelProvider.GOOGLE:
      case ModelProvider.VERTEX_AI:
        return this.changeBboxForGemini(result, imageData);
      default:
        return result;
    }
  }

  async changeBboxForGemini(result: ImageOcrTranslationResultDto, imageData: string) {
    const copiedResult = deepClone(result);
    const { width, height } = await this.getImageSize(imageData);

    copiedResult.ocr_result = result.ocr_result.map(({ box_2d, ...item }) => {
      const scaledBbox = this.scaleBboxByWidthHeight({ box_2d, width, height });
      return { ...item, box_2d: scaledBbox };
    });
    copiedResult.translated_result = result.translated_result.map(({ box_2d, ...item }) => {
      const scaledBbox = this.scaleBboxByWidthHeight({ box_2d, width, height });
      return { ...item, box_2d: scaledBbox };
    });

    return copiedResult;
  }

  async translate(dto: TranslateImageRequestDto): Promise<ImageOcrTranslationResultDto> {
    const { requestId, base64, promptPresetContent, aiSettings, cacheTag } = dto;

    const result = (await this.unifiedAiTranslator.translate({
      requestId,
      promptPresetContent: promptPresetContent || '',
      aiSettings,
      // fileName,
      imageData: base64,
      cacheTag,
    })) as ImageOcrTranslationResultDto;

    const bboxUpdatedResult = await this.changeBboxByModelProvider(result, base64, aiSettings);

    return bboxUpdatedResult;
  }
}
