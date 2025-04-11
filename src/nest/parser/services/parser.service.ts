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

  public async getJsonTranslationTargets(
    json: string,
    options: JsonParserOptionsDto,
    isFile = false
  ): Promise<TextPath[]> {
    return await this.jsonParserService.getTranslationTargets({
      source: json,
      options,
      isFile,
    });
  }

  public async applyJsonTranslation(
    json: string,
    translations: TranslatedTextPath[],
    options: JsonParserOptionsDto,
    isFile = false
  ): Promise<Record<string, unknown>> {
    return await this.jsonParserService.applyTranslation({
      source: json,
      translations,
      options,
      isFile,
    });
  }

  public async getPlainTextTranslationTargets(
    text: string,
    options: PlainTextParserOptionsDto,
    isFile = false
  ): Promise<TextPath[]> {
    return await this.plainTextParserService.getTranslationTargets({
      source: text,
      options,
      isFile,
    });
  }

  public async applyPlainTextTranslation(
    text: string,
    translations: TranslatedTextPath[],
    options: PlainTextParserOptionsDto,
    isFile = false
  ): Promise<string> {
    return await this.plainTextParserService.applyTranslation({
      source: text,
      translations,
      options,
      isFile,
    });
  }

  public async getCsvTranslationTargets(
    text: string,
    options: CsvParserOptionsDto,
    isFile = false
  ): Promise<TextPath[]> {
    return await this.csvParserService.getTranslationTargets({
      source: text,
      options,
      isFile,
    });
  }

  public async applyCsvTranslation(
    text: string,
    translations: TranslatedTextPath[],
    options: CsvParserOptionsDto,
    isFile = false
  ): Promise<string> {
    return await this.csvParserService.applyTranslation({
      source: text,
      translations,
      options,
      isFile,
    });
  }
}
