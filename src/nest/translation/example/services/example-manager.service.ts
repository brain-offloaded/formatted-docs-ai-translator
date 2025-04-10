import { Injectable } from '@nestjs/common';

import { deepClone } from '../../../../utils/deep-clone';
import { Language, SourceLanguage } from '../../../../utils/language';
import { tagTexts } from '../../../../utils/string';
import { TypeOrmService } from '../../../../nest/db/typeorm/typeorm.service';
import { ExamplePreset } from '../../../../nest/db/typeorm/entities/example-preset.entity';
import { LoggerService } from '../../../logger/logger.service';

export interface TranslationExampleMessage {
  source: string;
  result: string;
}
export type TranslationExampleMessages = {
  [K in SourceLanguage]: TranslationExampleMessage;
};

// 태그 없는 예제를 저장하기 위한 타입
export interface RawTranslationExampleMessage {
  sourceLines: string[];
  resultLines: string[];
}

export type RawTranslationExampleMessages = {
  [K in SourceLanguage]: RawTranslationExampleMessage;
};

@Injectable()
export class ExampleManagerService {
  private FIXED_EXAMPLES: RawTranslationExampleMessages = {
    [Language.CHINESE]: {
      sourceLines: [],
      resultLines: [],
    },
    [Language.ENGLISH]: {
      sourceLines: [],
      resultLines: [],
    },
    [Language.JAPANESE]: {
      sourceLines: [],
      resultLines: [],
    },
  };

  private CURRENT_EXAMPLES: RawTranslationExampleMessages = {
    [Language.CHINESE]: {
      sourceLines: [],
      resultLines: [],
    },
    [Language.ENGLISH]: {
      sourceLines: [],
      resultLines: [],
    },
    [Language.JAPANESE]: {
      sourceLines: [],
      resultLines: [],
    },
  };

  private readonly MAX_EXAMPLE_CHAR_COUNT = 300;
  private currentPresetName = ''; // 초기에는 빈 문자열, 나중에 첫 번째 프리셋을 사용

  constructor(
    private readonly typeOrmService: TypeOrmService,
    private readonly logger: LoggerService
  ) {
    this.clearCurrentExample();
    this.initializePreset();
  }

  /**
   * 초기 프리셋을 로드합니다. 첫 번째 프리셋을 사용합니다.
   */
  private async initializePreset() {
    try {
      // 모든 프리셋 가져오기
      const presets = await this.getAllPresets();

      // 프리셋이 있으면 첫 번째 프리셋 선택
      if (presets.length > 0) {
        await this.loadExamplePreset(presets[0].name);
      }
    } catch (e) {
      this.logger.error('초기 프리셋 로드 중 오류 발생:', { error: e });
    }
  }

  /**
   * 프리셋 이름으로 예제를 로드합니다.
   * @param presetName 프리셋 이름
   * @returns 성공 여부
   */
  public async loadExamplePreset(presetName: string): Promise<boolean> {
    try {
      const preset = await this.getPresetByName(presetName);

      if (!preset) {
        console.error(`Example preset with name "${presetName}" not found`);
        return false;
      }

      this.FIXED_EXAMPLES = preset.getExamples();
      this.currentPresetName = presetName;
      return true;
    } catch (e) {
      console.error(`Failed to load example preset: ${e}`);
      return false;
    }
  }

  /**
   * 이름으로 프리셋을 찾습니다.
   * @param presetName 프리셋 이름
   * @returns 프리셋 엔티티 또는 null
   */
  public async getPresetByName(presetName: string): Promise<ExamplePreset | null> {
    try {
      return await this.typeOrmService.examplePreset.findOne({
        where: { name: presetName },
      });
    } catch (e) {
      console.error(`Failed to find example preset by name: ${e}`);
      return null;
    }
  }

  /**
   * 프리셋의 예제와 설명, 이름을 업데이트합니다.
   * @param presetId 프리셋 ID
   * @param examples 업데이트할 예제 데이터
   * @param description 업데이트할 설명 (선택사항)
   * @param name 업데이트할 이름 (선택사항)
   * @returns 성공 여부
   */
  public async updatePresetExamples(
    presetId: number,
    examples: Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>,
    description?: string | null,
    name?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const preset = await this.typeOrmService.examplePreset.findOne({
        where: { id: presetId },
      });

      if (!preset) {
        return { success: false, message: '프리셋을 찾을 수 없습니다.' };
      }

      // 이름 변경 (제공된 경우)
      const oldName = preset.name;
      let nameChanged = false;

      if (name && name !== preset.name) {
        // 이름 변경 시 중복 확인
        const existingPreset = await this.getPresetByName(name);
        if (existingPreset && existingPreset.id !== presetId) {
          throw new Error(`이미 '${name}' 이름의 프리셋이 존재합니다.`);
        }

        preset.name = name;
        nameChanged = true;
      }

      // 예제 업데이트
      preset.setExamples(examples);

      // 설명 업데이트 (제공된 경우)
      if (description !== undefined) {
        preset.description = description;
      }

      await this.typeOrmService.examplePreset.save(preset);

      // 현재 사용 중인 프리셋이 업데이트된 경우 다시 로드
      if (this.currentPresetName === oldName) {
        this.FIXED_EXAMPLES = examples;

        // 이름이 변경된 경우 현재 프리셋 이름도 업데이트
        if (nameChanged) {
          this.currentPresetName = name!;
        }
      }

      return { success: true, message: '프리셋이 성공적으로 업데이트되었습니다.' };
    } catch (e) {
      const message =
        (e as { message?: string })?.message || '프리셋 업데이트 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  }

  /**
   * 현재 사용 중인 프리셋 이름을 반환합니다.
   */
  public getCurrentPresetName(): string {
    return this.currentPresetName;
  }

  /**
   * 모든 프리셋 목록을 가져옵니다.
   */
  public async getAllPresets(): Promise<ExamplePreset[]> {
    return this.typeOrmService.examplePreset.find();
  }

  /**
   * 새 프리셋을 생성합니다. 비어있는 상태로 초기화합니다.
   */
  public async createPreset(
    name: string,
    description: string | null,
    examples?: RawTranslationExampleMessages
  ): Promise<ExamplePreset> {
    const preset = new ExamplePreset();
    preset.name = name;
    preset.description = description;

    // 빈 예제로 초기화 또는 제공된 예제 사용
    const emptyExamples: RawTranslationExampleMessages = {
      [Language.CHINESE]: { sourceLines: [], resultLines: [] },
      [Language.ENGLISH]: { sourceLines: [], resultLines: [] },
      [Language.JAPANESE]: { sourceLines: [], resultLines: [] },
    };

    preset.setExamples(examples || emptyExamples);

    return this.typeOrmService.examplePreset.save(preset);
  }

  /**
   * 프리셋을 삭제합니다.
   * @param presetId 삭제할 프리셋 ID
   * @returns 성공 여부
   */
  public async deletePreset(presetId: number): Promise<boolean> {
    try {
      const preset = await this.typeOrmService.examplePreset.findOne({
        where: { id: presetId },
      });

      if (!preset) {
        return false;
      }

      // 삭제할 프리셋이 현재 사용 중이면 다른 프리셋으로 변경
      if (this.currentPresetName === preset.name) {
        // 현재 삭제되는 프리셋 외에 다른 프리셋이 있는지 확인
        const allPresets = await this.getAllPresets();
        const otherPresets = allPresets.filter((p) => p.id !== presetId);

        if (otherPresets.length > 0) {
          // 다른 프리셋이 있으면 첫 번째 프리셋 선택
          await this.loadExamplePreset(otherPresets[0].name);
        } else {
          // 다른 프리셋이 없으면 FIXED_EXAMPLES 초기화
          this.FIXED_EXAMPLES = {
            [Language.CHINESE]: { sourceLines: [], resultLines: [] },
            [Language.ENGLISH]: { sourceLines: [], resultLines: [] },
            [Language.JAPANESE]: { sourceLines: [], resultLines: [] },
          };
          this.currentPresetName = '';
        }
      }

      // 프리셋 삭제
      await this.typeOrmService.examplePreset.remove(preset);
      return true;
    } catch (e) {
      console.error(`프리셋 삭제 중 오류 발생: ${e}`);
      return false;
    }
  }

  public appendCurrentExample(language: SourceLanguage, sources: string[], results: string[]) {
    if (!this.CURRENT_EXAMPLES[language]) {
      this.CURRENT_EXAMPLES[language] = { sourceLines: [], resultLines: [] };
    }

    // 현재 예제 가져오기
    const { sourceLines: currentSourceLines, resultLines: currentResultLines } =
      this.getRawCurrentExample(language);

    // 새로운 예제들 추가
    const allSourceLines = [...currentSourceLines, ...sources];
    const allResultLines = [...currentResultLines, ...results];

    // 전체 문자 수 계산
    let totalCharCount = 0;
    let startIndex = 0;

    // 뒤에서부터 문자 수를 계산하여 MAX_EXAMPLE_CHAR_COUNT를 고려한 최근 예제들만 선택
    for (let i = allSourceLines.length - 1; i >= 0; i--) {
      totalCharCount += allSourceLines[i].length;
      if (totalCharCount > this.MAX_EXAMPLE_CHAR_COUNT) {
        startIndex = i + 1;
        break;
      }
    }

    // 선택된 예제들만 추출
    const selectedSourceLines = allSourceLines.slice(startIndex);
    const selectedResultLines = allResultLines.slice(startIndex);

    this.CURRENT_EXAMPLES[language] = {
      sourceLines: selectedSourceLines,
      resultLines: selectedResultLines,
    };
  }

  private getFixedRawExample(language: SourceLanguage): RawTranslationExampleMessage;
  private getFixedRawExample(): RawTranslationExampleMessages;

  private getFixedRawExample(
    language?: SourceLanguage
  ): RawTranslationExampleMessage | RawTranslationExampleMessages {
    if (language) {
      return this.FIXED_EXAMPLES[language];
    }

    return this.FIXED_EXAMPLES;
  }

  private getRawCurrentExample(language: SourceLanguage): RawTranslationExampleMessage;
  private getRawCurrentExample(): RawTranslationExampleMessages;

  private getRawCurrentExample(
    language?: SourceLanguage
  ): RawTranslationExampleMessage | RawTranslationExampleMessages {
    if (language) {
      return this.CURRENT_EXAMPLES[language];
    }
    return this.CURRENT_EXAMPLES;
  }

  private clearCurrentExample(language?: SourceLanguage) {
    if (language) {
      this.CURRENT_EXAMPLES[language] = { sourceLines: [], resultLines: [] };
    } else {
      this.CURRENT_EXAMPLES = {
        [Language.CHINESE]: { sourceLines: [], resultLines: [] },
        [Language.ENGLISH]: { sourceLines: [], resultLines: [] },
        [Language.JAPANESE]: { sourceLines: [], resultLines: [] },
      };
    }
  }

  public async getExample(language: SourceLanguage): Promise<TranslationExampleMessage> {
    // 현재 프리셋에서 고정 예제 가져오기
    const fixedExample = this.getFixedRawExample(language);
    const currentExample = this.getRawCurrentExample(language);

    if (!fixedExample && !currentExample) {
      return { source: '', result: '' };
    }

    const combinedSourceLines = [...fixedExample.sourceLines, ...currentExample.sourceLines];
    const combinedResultLines = [...fixedExample.resultLines, ...currentExample.resultLines];

    return {
      source: tagTexts(combinedSourceLines),
      result: tagTexts(combinedResultLines),
    };
  }

  /**
   * 현재 사용 중인 예제들을 반환합니다.
   * 현재 고정 예제와 현재 추가된 예제 모두 포함합니다.
   */
  public getCurrentExamples(): RawTranslationExampleMessages {
    // 현재 상태의 FIXED_EXAMPLES와 CURRENT_EXAMPLES를 합친 결과 생성
    const mergedExamples: RawTranslationExampleMessages = {
      [Language.CHINESE]: {
        sourceLines: [
          ...this.FIXED_EXAMPLES[Language.CHINESE].sourceLines,
          ...this.CURRENT_EXAMPLES[Language.CHINESE].sourceLines,
        ],
        resultLines: [
          ...this.FIXED_EXAMPLES[Language.CHINESE].resultLines,
          ...this.CURRENT_EXAMPLES[Language.CHINESE].resultLines,
        ],
      },
      [Language.ENGLISH]: {
        sourceLines: [
          ...this.FIXED_EXAMPLES[Language.ENGLISH].sourceLines,
          ...this.CURRENT_EXAMPLES[Language.ENGLISH].sourceLines,
        ],
        resultLines: [
          ...this.FIXED_EXAMPLES[Language.ENGLISH].resultLines,
          ...this.CURRENT_EXAMPLES[Language.ENGLISH].resultLines,
        ],
      },
      [Language.JAPANESE]: {
        sourceLines: [
          ...this.FIXED_EXAMPLES[Language.JAPANESE].sourceLines,
          ...this.CURRENT_EXAMPLES[Language.JAPANESE].sourceLines,
        ],
        resultLines: [
          ...this.FIXED_EXAMPLES[Language.JAPANESE].resultLines,
          ...this.CURRENT_EXAMPLES[Language.JAPANESE].resultLines,
        ],
      },
    };

    return deepClone(mergedExamples);
  }
}
