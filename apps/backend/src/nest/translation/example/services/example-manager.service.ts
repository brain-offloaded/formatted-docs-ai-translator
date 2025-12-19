import { Injectable, NotFoundException } from '@nestjs/common'; // NotFoundException 추가

import { deepClone } from '@/nest/utils/deep-clone';
import { SourceLanguage, TargetLanguage, targetLanguages } from '@apps/common/dist/language';
import { tagTexts } from '@/nest/utils/string';
import { Prisma, ExamplePreset } from '@prisma/client';
import { PrismaService } from '@/nest/db/prisma/prisma.service';
import { LoggerService } from '../../../logger/logger.service';
import {
  TranslationExampleMatrix,
  TranslationExamplePair,
} from '@apps/common/dist/types/translation-example.types';
import {
  createEmptyExampleMatrix,
  createEmptyExamplePair,
  normalizeExampleMatrix,
} from '@/nest/translation/example/utils/example-matrix';

export interface TranslationExampleMessage {
  source: string;
  result: string;
  lineCount: number;
}

type RawTranslationExampleMessages = TranslationExampleMatrix;

@Injectable()
export class ExampleManagerService {
  private FIXED_EXAMPLES: RawTranslationExampleMessages = createEmptyExampleMatrix();

  // requestId별 CURRENT_EXAMPLES 관리
  private REQUEST_EXAMPLES: Map<string, RawTranslationExampleMessages> = new Map();

  private readonly MAX_EXAMPLE_CHAR_COUNT = 2000;
  private readonly MAX_REQUEST_CACHE_SIZE = 100; // 최대 캐시할 요청 수
  private currentPresetName = ''; // 초기에는 빈 문자열, 나중에 첫 번째 프리셋을 사용

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService
  ) {
    this.initializePreset();
  }

  /**
   * 공통 ANY 언어 처리: 소스 언어가 ANY 인지 여부
   */
  private isAnySourceLanguage(
    sourceLanguage: SourceLanguage
  ): sourceLanguage is SourceLanguage.ANY {
    return sourceLanguage === SourceLanguage.ANY;
  }

  private asTargetLanguage(sourceLanguage: SourceLanguage): TargetLanguage {
    if (this.isAnySourceLanguage(sourceLanguage)) {
      throw new Error('ANY source language cannot be used as a translation language.');
    }
    return sourceLanguage as unknown as TargetLanguage;
  }

  /**
   * 공통 반환: 빈 예제 페어
   */
  private getEmptyExamplePair(): TranslationExamplePair {
    return createEmptyExamplePair();
  }

  /**
   * 공통 반환: 빈 예제 메시지
   */
  private getEmptyExampleMessage(): TranslationExampleMessage {
    return { source: '', result: '', lineCount: 0 };
  }

  private parsePresetExamples(preset: ExamplePreset): TranslationExampleMatrix {
    try {
      const parsed = JSON.parse(preset.examples);
      return normalizeExampleMatrix(parsed);
    } catch (error) {
      this.logger.error('예제 데이터 파싱 중 오류 발생:', { error });
      return createEmptyExampleMatrix();
    }
  }

  private stringifyExamples(examples: RawTranslationExampleMessages): string {
    return JSON.stringify(normalizeExampleMatrix(examples));
  }

  public extractExamples(preset: ExamplePreset): TranslationExampleMatrix {
    return this.parsePresetExamples(preset);
  }

  /**
   * requestId에 해당하는 CURRENT_EXAMPLES를 가져오거나 생성합니다.
   */
  private getCurrentExamplesForRequest(requestId: string): RawTranslationExampleMessages {
    if (!this.REQUEST_EXAMPLES.has(requestId)) {
      this.REQUEST_EXAMPLES.set(requestId, createEmptyExampleMatrix());

      // 메모리 누수 방지: 최대 캐시 크기를 초과하면 가장 오래된 것을 제거
      if (this.REQUEST_EXAMPLES.size > this.MAX_REQUEST_CACHE_SIZE) {
        const firstKey = this.REQUEST_EXAMPLES.keys().next().value;
        if (firstKey) {
          this.REQUEST_EXAMPLES.delete(firstKey);
        }
      }
    }
    return this.REQUEST_EXAMPLES.get(requestId)!;
  }

  /**
   * 특정 requestId의 예제를 정리합니다.
   */
  public clearRequestExamples(requestId: string): void {
    this.REQUEST_EXAMPLES.delete(requestId);
  }

  /**
   * 모든 요청 예제를 정리합니다. (메모리 정리용)
   */
  public clearAllRequestExamples(): void {
    this.REQUEST_EXAMPLES.clear();
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
        this.logger.error(`Example preset with name "${presetName}" not found`);
        return false;
      }

      this.FIXED_EXAMPLES = this.parsePresetExamples(preset);
      this.currentPresetName = presetName;
      return true;
    } catch (e) {
      this.logger.error(`Failed to load example preset: ${e}`);
      return false;
    }
  }

  /**
   * ID로 프리셋을 찾습니다.
   * @param presetId 프리셋 ID
   * @returns 프리셋 엔티티
   * @throws NotFoundException 프리셋을 찾지 못한 경우
   */
  public async getPresetById(presetId: number): Promise<ExamplePreset> {
    try {
      const preset = await this.prisma.examplePreset.findUnique({
        where: { id: presetId },
      });
      if (!preset) {
        // NotFoundException을 사용하여 핸들러에서 적절히 처리하도록 함
        throw new NotFoundException(`ID ${presetId}에 해당하는 예제 프리셋을 찾을 수 없습니다.`);
      }
      return preset;
    } catch (e) {
      this.logger.error(`Failed to find example preset by ID: ${presetId}`, { error: e });
      throw e; // 오류를 다시 던짐
    }
  }

  /**
   * 이름으로 프리셋을 찾습니다. (내부 사용 또는 필요한 경우 유지)
   * @param presetName 프리셋 이름
   * @returns 프리셋 엔티티 또는 null
   */
  public async getPresetByName(presetName: string): Promise<ExamplePreset | null> {
    try {
      return await this.prisma.examplePreset.findUnique({
        where: { name: presetName },
      });
    } catch (e) {
      this.logger.error(`Failed to find example preset by name: ${e}`);
      return null;
    }
  }

  /**
   * 프리셋 ID로 예제 매트릭스를 조회합니다.
   */
  public async getPresetExampleMatrix(presetId: number): Promise<TranslationExampleMatrix> {
    const preset = await this.getPresetById(presetId);
    return this.parsePresetExamples(preset);
  }

  /**
   * 특정 언어 쌍에 대한 예제 페어를 조회합니다.
   */
  public async getPresetExamplePair(
    presetId: number,
    sourceLanguage: TargetLanguage,
    targetLanguage: TargetLanguage
  ): Promise<TranslationExamplePair> {
    const matrix = await this.getPresetExampleMatrix(presetId);
    return matrix[sourceLanguage]?.[targetLanguage] ?? createEmptyExamplePair();
  }

  /**
   * 프리셋의 예제와 설명, 이름을 업데이트합니다.
   * @param presetId 프리셋 ID
   * @param examples 업데이트할 예제 데이터
   * @param description 업데이트할 설명 (선택사항)
   * @param name 업데이트할 이름 (선택사항)
   * @returns 성공 여부 및 메시지
   */
  public async updatePresetExamples(
    presetId: number,
    examples: RawTranslationExampleMessages,
    description?: string | null,
    name?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const preset = await this.getPresetById(presetId);

      const oldName = preset.name;
      const normalizedExamples = normalizeExampleMatrix(examples);

      let nameChanged = false;
      if (name && name !== preset.name) {
        const existingPreset = await this.getPresetByName(name);
        if (existingPreset && existingPreset.id !== presetId) {
          throw new Error(`이미 '${name}' 이름의 프리셋이 존재합니다.`);
        }
        nameChanged = true;
      }

      const updateData: Prisma.ExamplePresetUpdateInput = {
        examples: this.stringifyExamples(normalizedExamples),
      };

      if (description !== undefined) {
        updateData.description = description;
      }

      if (nameChanged && name) {
        updateData.name = name;
      }

      await this.prisma.examplePreset.update({
        where: { id: presetId },
        data: updateData,
      });

      if (this.currentPresetName === oldName) {
        this.FIXED_EXAMPLES = normalizedExamples;

        if (nameChanged && name) {
          this.currentPresetName = name;
        }
      }

      return { success: true, message: '프리셋이 성공적으로 업데이트되었습니다.' };
    } catch (e) {
      const message =
        (e as { message?: string })?.message || '프리셋 업데이트 중 오류가 발생했습니다.';
      // NotFoundException인 경우 메시지를 그대로 사용
      if (e instanceof NotFoundException) {
        return { success: false, message: e.message };
      }
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
    try {
      return await this.prisma.examplePreset.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      this.logger.error('예제 프리셋 목록 조회 중 오류 발생:', { error });
      throw error;
    }
  }

  /**
   * 새 프리셋을 생성합니다. 비어있는 상태로 초기화합니다.
   */
  public async createPreset(
    name: string,
    description: string | null,
    examples?: RawTranslationExampleMessages
  ): Promise<ExamplePreset> {
    try {
      // 이름 중복 확인
      const existingPreset = await this.getPresetByName(name);
      if (existingPreset) {
        throw new Error(`'${name}' 이름의 프리셋이 이미 존재합니다.`);
      }

      const presetExamples = examples
        ? normalizeExampleMatrix(examples)
        : createEmptyExampleMatrix();

      return await this.prisma.examplePreset.create({
        data: {
          name,
          description,
          examples: this.stringifyExamples(presetExamples),
        },
      });
    } catch (error) {
      this.logger.error('예제 프리셋 생성 중 오류 발생:', { error, name });
      throw error;
    }
  }

  /**
   * 프리셋을 삭제합니다.
   * @param presetId 삭제할 프리셋 ID
   * @returns 성공 여부
   */
  public async deletePreset(presetId: number): Promise<boolean> {
    try {
      // getPresetById 사용으로 변경 (NotFoundException 처리 가능)
      const preset = await this.getPresetById(presetId);

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
          this.FIXED_EXAMPLES = createEmptyExampleMatrix();
          this.currentPresetName = '';
        }
      }

      // 프리셋 삭제
      await this.prisma.examplePreset.delete({ where: { id: presetId } });
      return true;
    } catch (e) {
      this.logger.error(`프리셋 삭제 중 오류 발생: ID ${presetId}`, { error: e });
      // NotFoundException인 경우 false 반환 (핸들러에서 처리)
      if (e instanceof NotFoundException) {
        return false;
      }
      throw e; // 다른 오류는 다시 던짐
    }
  }

  public appendCurrentExample(
    requestId: string,
    sourceLanguage: SourceLanguage,
    targetLanguage: TargetLanguage,
    sources: string[],
    results: string[]
  ): void {
    if (this.isAnySourceLanguage(sourceLanguage)) {
      return;
    }
    const currentExamples = this.getCurrentExamplesForRequest(requestId);
    const lang = this.asTargetLanguage(sourceLanguage);
    const currentExample = currentExamples[lang][targetLanguage] ?? createEmptyExamplePair();

    const allSourceLines = [...currentExample.sourceLines, ...sources];
    const allResultLines = [...currentExample.resultLines, ...results];

    let totalCharCount = 0;
    let startIndex = 0;

    for (let i = allSourceLines.length - 1; i >= 0; i--) {
      totalCharCount += allSourceLines[i].length;
      if (totalCharCount > this.MAX_EXAMPLE_CHAR_COUNT) {
        startIndex = i + 1;
        break;
      }
    }

    const selectedSourceLines = allSourceLines.slice(startIndex);
    const selectedResultLines = allResultLines.slice(startIndex);

    currentExamples[lang][targetLanguage] = {
      sourceLines: selectedSourceLines,
      resultLines: selectedResultLines,
    };
  }

  private getFixedRawExample(
    sourceLanguage: SourceLanguage,
    targetLanguage: TargetLanguage
  ): TranslationExamplePair;
  private getFixedRawExample(): RawTranslationExampleMessages;

  private getFixedRawExample(
    sourceLanguage?: SourceLanguage,
    targetLanguage?: TargetLanguage
  ): TranslationExamplePair | RawTranslationExampleMessages {
    if (sourceLanguage && this.isAnySourceLanguage(sourceLanguage)) {
      return this.getEmptyExamplePair();
    }
    if (sourceLanguage && targetLanguage) {
      return (
        this.FIXED_EXAMPLES[this.asTargetLanguage(sourceLanguage)][targetLanguage] ??
        createEmptyExamplePair()
      );
    }

    return this.FIXED_EXAMPLES;
  }

  private getRawCurrentExample(
    requestId: string,
    sourceLanguage: SourceLanguage,
    targetLanguage: TargetLanguage
  ): TranslationExamplePair;
  private getRawCurrentExample(requestId: string): RawTranslationExampleMessages;

  private getRawCurrentExample(
    requestId: string,
    sourceLanguage?: SourceLanguage,
    targetLanguage?: TargetLanguage
  ): TranslationExamplePair | RawTranslationExampleMessages {
    const currentExamples = this.getCurrentExamplesForRequest(requestId);
    if (sourceLanguage && this.isAnySourceLanguage(sourceLanguage)) {
      return this.getEmptyExamplePair();
    }
    if (sourceLanguage && targetLanguage) {
      return (
        currentExamples[this.asTargetLanguage(sourceLanguage)][targetLanguage] ??
        createEmptyExamplePair()
      );
    }
    return currentExamples;
  }

  public async getExample(
    requestId: string,
    sourceLanguage: SourceLanguage,
    targetLanguage: TargetLanguage
  ): Promise<TranslationExampleMessage> {
    if (this.isAnySourceLanguage(sourceLanguage)) {
      return this.getEmptyExampleMessage();
    }
    // 현재 프리셋에서 고정 예제 가져오기
    const fixedExample = this.getFixedRawExample(sourceLanguage, targetLanguage);
    const currentExample = this.getRawCurrentExample(requestId, sourceLanguage, targetLanguage);

    if (!fixedExample && !currentExample) {
      return { source: '', result: '', lineCount: 0 };
    }

    const combinedSourceLines = [...fixedExample.sourceLines, ...currentExample.sourceLines];
    const combinedResultLines = [...fixedExample.resultLines, ...currentExample.resultLines];
    const { taggedTexts: source, lastIndex: sourceLastIndex } = tagTexts(combinedSourceLines);
    const { taggedTexts: result, lastIndex: resultLastIndex } = tagTexts(
      combinedResultLines,
      1,
      'translated_text'
    );
    if (sourceLastIndex !== resultLastIndex) {
      throw new Error(
        `Source and result line count mismatch: source=${sourceLastIndex}, result=${resultLastIndex}`
      );
    }

    return {
      source,
      result,
      lineCount: resultLastIndex,
    };
  }

  /**
   * 현재 사용 중인 예제들을 반환합니다.
   * 현재 고정 예제와 현재 추가된 예제 모두 포함합니다.
   */
  public getCurrentExamples(requestId: string): RawTranslationExampleMessages {
    const currentExamples = this.getCurrentExamplesForRequest(requestId);
    const mergedExamples = createEmptyExampleMatrix();

    for (const source of targetLanguages) {
      for (const target of targetLanguages) {
        const fixed = this.FIXED_EXAMPLES[source][target] ?? createEmptyExamplePair();
        const current = currentExamples[source][target] ?? createEmptyExamplePair();
        mergedExamples[source][target] = {
          sourceLines: [...fixed.sourceLines, ...current.sourceLines],
          resultLines: [...fixed.resultLines, ...current.resultLines],
        };
      }
    }

    return deepClone(mergedExamples);
  }
}
