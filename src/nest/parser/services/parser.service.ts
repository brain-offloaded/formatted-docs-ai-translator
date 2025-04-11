import { Injectable } from '@nestjs/common';

import { TextPath, TranslatedTextPath } from '../../../types/common';
import { JsonParserService } from './json-parser.service';
import { PlainTextParserService } from './plain-text-parser.service';
import { CsvParserService } from './csv-parser.service';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';

@Injectable()
export class ParserService {
  constructor(
    private readonly jsonParserService: JsonParserService,
    private readonly plainTextParserService: PlainTextParserService,
    private readonly csvParserService: CsvParserService
  ) {}

  /**
   * JSON 파일 또는 문자열에서 번역 대상을 추출합니다.
   * @param content 파일 경로 또는 JSON 문자열
   * @param options 파싱 옵션
   * @param isFile content가 파일 경로인지 여부
   */
  public async getJsonTranslationTargets(
    content: string,
    options: JsonParserOptionsDto,
    isFile = false
  ): Promise<TextPath[]> {
    return await this.jsonParserService.getTranslationTargets({
      source: content,
      options,
      isFile,
    });
  }

  /**
   * JSON 파일 또는 문자열에 번역을 적용합니다.
   * @param content 파일 경로 또는 JSON 문자열
   * @param translations 번역된 텍스트 목록
   * @param options 번역 적용 옵션
   * @param isFile content가 파일 경로인지 여부
   */
  public async applyJsonTranslation(
    content: string,
    translations: TranslatedTextPath[],
    options: JsonParserOptionsDto,
    isFile = false
  ): Promise<Record<string, unknown>> {
    return await this.jsonParserService.applyTranslation({
      source: content,
      translations,
      options,
      isFile,
    });
  }

  /**
   * 일반 텍스트 파일 또는 문자열에서 번역 대상을 추출합니다.
   * @param content 파일 경로 또는 텍스트 문자열
   * @param options 파싱 옵션
   * @param isFile content가 파일 경로인지 여부
   */
  public async getPlainTextTranslationTargets(
    content: string,
    options: PlainTextParserOptionsDto,
    isFile = false
  ): Promise<TextPath[]> {
    return await this.plainTextParserService.getTranslationTargets({
      source: content,
      options,
      isFile,
    });
  }

  /**
   * 일반 텍스트 파일 또는 문자열에 번역을 적용합니다.
   * @param content 파일 경로 또는 텍스트 문자열
   * @param translations 번역된 텍스트 목록
   * @param options 번역 적용 옵션
   * @param isFile content가 파일 경로인지 여부
   */
  public async applyPlainTextTranslation(
    content: string,
    translations: TranslatedTextPath[],
    options: PlainTextParserOptionsDto,
    isFile = false
  ): Promise<string> {
    return await this.plainTextParserService.applyTranslation({
      source: content,
      translations,
      options,
      isFile,
    });
  }

  /**
   * CSV 파일 또는 문자열에서 번역 대상을 추출합니다.
   * @param content 파일 경로 또는 CSV 문자열
   * @param options 파싱 옵션
   * @param isFile content가 파일 경로인지 여부
   */
  public async getCsvTranslationTargets(
    content: string,
    options: CsvParserOptionsDto,
    isFile = false
  ): Promise<TextPath[]> {
    return await this.csvParserService.getTranslationTargets({
      source: content,
      options,
      isFile,
    });
  }

  /**
   * CSV 파일 또는 문자열에 번역을 적용합니다.
   * @param content 파일 경로 또는 CSV 문자열
   * @param translations 번역된 텍스트 목록
   * @param options 번역 적용 옵션
   * @param isFile content가 파일 경로인지 여부
   */
  public async applyCsvTranslation(
    content: string,
    translations: TranslatedTextPath[],
    options: CsvParserOptionsDto,
    isFile = false
  ): Promise<string> {
    return await this.csvParserService.applyTranslation({
      source: content,
      translations,
      options,
      isFile,
    });
  }
}
