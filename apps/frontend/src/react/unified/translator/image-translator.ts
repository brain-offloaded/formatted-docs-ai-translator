import { AiTranslatorConfig } from '@/react/types/config';
import { TranslationUnit } from '../domain/translation-unit';
import { ITranslator } from './i-translator';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { ImageTranslatorService as ImageTranslatorApiService } from '@/react/api/generated/services/ImageTranslatorService';
import { TranslateImageRequestDto } from '@/react/api/generated/models/TranslateImageRequestDto';
import { buildTranslatorAiSettings } from './build-translator-ai-settings';

export class ImageTranslator implements ITranslator {
  async translate(
    units: TranslationUnit[],
    config: AiTranslatorConfig,
    promptPresetContent?: string,
    sourceFilePath?: string
  ): Promise<TranslationUnit[]> {
    // 기존 파서가 단일 유닛(이미지 base64)을 반환 -> 여기서 블록 단위 유닛으로 재구성
    if (units.length !== 1) {
      throw new Error('ImageTranslator only supports single image translation');
    }
    const unit = units[0];

    const requestId = crypto.randomUUID();
    const payload: TranslateImageRequestDto = {
      requestId,
      aiSettings: buildTranslatorAiSettings(config),
      base64: unit.source,
      promptPresetContent: promptPresetContent ?? '',
      sourceFilePath: sourceFilePath ?? '',
      cacheTag: config.cacheTag?.trim() ? config.cacheTag.trim() : DEFAULT_CACHE_TAG,
    };

    const response = await ImageTranslatorApiService.imageTranslatorControllerTranslateImage({
      requestBody: payload,
    });

    if (!response.success) {
      throw new Error(response.message);
    }

    const result = response.result;
    const ocr = result.ocr_result || [];
    const translated = result.translated_result || [];

    // 길이 보정 (혹시 불일치 시 안전하게 짧은 길이 사용)
    const len = Math.min(ocr.length, translated.length);

    // key 포맷: `${fileName}|${JSON.stringify(box_2d)}|${base64}`
    const fileName = unit.key; // 파서가 넣어둔 원본 파일명
    const base64 = unit.source; // 원본 이미지 base64

    const blockUnits: TranslationUnit[] = [];
    for (let i = 0; i < len; i++) {
      const o = ocr[i];
      const t = translated[i];
      blockUnits.push({
        key: `${fileName}|${JSON.stringify(o.box_2d)}|${base64}`,
        source: o.text,
        target: t?.text ?? '',
      });
    }

    return blockUnits;
  }
}
