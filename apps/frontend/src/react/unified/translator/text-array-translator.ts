import { AiTranslatorConfig } from '@/react/types/config';
import { isLanguage } from '@apps/common/dist/language';
import { shouldTranslateString } from '@/react/unified/parser/utils/should-translate-string';
import { TranslationUnit } from '../domain/translation-unit';
import { ITranslator } from './i-translator';
import { DEFAULT_CACHE_TAG } from '@apps/common/dist/constants/cache';
import { TranslateTextArrayRequestDto } from '@/react/api/generated/models/TranslateTextArrayRequestDto';
import { TranslateTextArrayResponseDto } from '@/react/api/generated/models/TranslateTextArrayResponseDto';
import { TextTranslatorService as TextTranslatorApiService } from '@/react/api/generated/services/TextTranslatorService';
import { buildTranslatorAiSettings } from './build-translator-ai-settings';

export class TextArrayTranslator implements ITranslator {
  private removeLineBreaks(text: string): string {
    return text.replace(/\r?\n|\r/g, '');
  }

  async translate(
    units: TranslationUnit[],
    config: AiTranslatorConfig,
    promptPresetContent?: string,
    sourceFilePath?: string
  ): Promise<TranslationUnit[]> {
    const requestId = crypto.randomUUID();

    // 개행 제거는 요청 품질 및 캐시 키 안정화를 위해 수행
    // const lineRemovedUnits: TranslationUnit[] = units.map(({ key, source, target }) => ({
    // 1) 개행 제거로 정규화
    const normalizedUnits: TranslationUnit[] = units.map(({ key, source, target }) => ({
      key,
      source: this.removeLineBreaks(source),
      target,
    }));
    // 빈 문자열은 번역 요청에서 제외하되, 원본 인덱스 매핑을 유지
    // const filteredIndexMap: number[] = [];
    // const filteredUnits: TranslationUnit[] = [];
    // for (let i = 0; i < lineRemovedUnits.length; i++) {
    //   const u = lineRemovedUnits[i];
    //   if (u.source.trim() !== '') {
    //     filteredIndexMap.push(i);
    //     filteredUnits.push(u);
    //   }

    // 2) 번역 대상 선정
    // - shouldTranslateString: 유니코드 Letter가 있는지
    // - isLanguage: 설정된 sourceLanguage에 해당하는지
    const translatable = normalizedUnits
      .map((unit, index) => ({ unit, index }))
      .filter(({ unit: { source } }) => {
        const text = source.trim();
        if (!shouldTranslateString(text)) return false;
        return isLanguage(text, config.sourceLanguage);
      });

    // 번역할 항목이 없다면 원본을 그대로 반환
    if (translatable.length === 0) {
      return units;
    }

    const payload: TranslateTextArrayRequestDto = {
      requestId,
      aiSettings: buildTranslatorAiSettings(config),
      promptPresetContent: promptPresetContent ?? '',
      sourceFilePath: sourceFilePath ?? '',
      textPaths: translatable.map(({ unit: { source, key } }) => ({ text: source, path: key })),
      cacheTag: config.cacheTag?.trim() ? config.cacheTag.trim() : DEFAULT_CACHE_TAG,
    };

    const response: TranslateTextArrayResponseDto =
      await TextTranslatorApiService.textTranslatorControllerTranslateText({
        requestBody: payload,
      });

    if (!response.success) {
      throw new Error(response.message);
    }

    // 응답을 필터링 전 원본 인덱스로 역매핑하여 target 채움
    // const result: TranslationUnit[] = units.map((u) => ({ ...u }));
    // const translated = response.translatedTextPaths;
    // const limit = Math.min(filteredIndexMap.length, translated.length);
    // for (let i = 0; i < limit; i++) {
    //   const originalIndex = filteredIndexMap[i];
    //   result[originalIndex].target = translated[i].translatedText;
    // }
    // 3) 응답을 원본 인덱스로 매핑
    const result: TranslationUnit[] = units.map((u) => ({ ...u }));
    translatable.forEach(({ index }, i) => {
      const translated = response.translatedTextPaths[i]?.translatedText ?? '';
      result[index] = { ...result[index], target: translated };
    });

    return result;
  }
}
