import { SimpleTextPath, SimpleTranslatedTextPath } from '../../../types/common';
import { BaseParseOptionsDto } from '../dto/options/base-parse-options.dto';
import * as fs from 'fs/promises';

export abstract class BaseParserService<
  TargetFormat,
  ParserOptions extends BaseParseOptionsDto,
  ParsedInformation = SimpleTextPath,
  TranslatedInformation = SimpleTranslatedTextPath,
> {
  /**
   * 기본 파일 읽기.
   * 파일 경로가 주어지면 파일을 읽어 문자열로 반환합니다.
   * 특별한 경우가 아니면 이 메서드를 재정의하지 않습니다.
   */
  public async readFile(filePath: string, options: ParserOptions): Promise<TargetFormat> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.readString(content, options);
  }

  /**
   * 기본 문자열 읽기.
   * 문자열이 주어지면 그대로 반환합니다.
   * 특별한 경우가 아니면 이 메서드를 재정의하지 않습니다.
   */
  public async readString(content: string, _options: ParserOptions): Promise<TargetFormat> {
    return content as TargetFormat;
  }

  public async read(params: { source: string; options: ParserOptions }): Promise<TargetFormat> {
    if (params.options.isFile) {
      return await this.readFile(params.source, params.options);
    }
    return await this.readString(params.source, params.options);
  }

  public abstract getTranslationTargets(params: {
    source: string;
    options: ParserOptions;
  }): Promise<ParsedInformation[]>;

  public abstract applyTranslation(params: {
    source: string;
    translations: TranslatedInformation[];
    options: ParserOptions;
  }): Promise<TargetFormat>;
}
