import { TextPath, TranslatedTextPath } from '@/types/common';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';

import { BaseParserService } from './base-parser-service';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';

@Injectable()
export class PlainTextParserService extends BaseParserService<string, PlainTextParserOptionsDto> {
  /**
   * 파일 경로로부터 텍스트 파일을 읽어 문자열로 반환합니다.
   */
  public async readFile(filePath: string, options: PlainTextParserOptionsDto): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.readString(content, options);
  }

  /**
   * 텍스트 문자열을 그대로 반환합니다.
   */
  public async readString(content: string, _options: PlainTextParserOptionsDto): Promise<string> {
    return content;
  }

  public async getTranslationTargets(params: {
    source: string;
    options: PlainTextParserOptionsDto;
  }): Promise<TextPath[]> {
    // read 메서드를 사용하여 source를 TargetFormat(string)으로 변환
    const source = await this.read(params);

    return source.split('\n').map((line) => ({ text: line.trim(), path: '' }));
  }

  public async applyTranslation(params: {
    source: string;
    translations: TranslatedTextPath[];
    options: PlainTextParserOptionsDto;
  }): Promise<string> {
    // read 메서드를 사용하여 source를 TargetFormat(string)으로 변환
    const source = await this.read(params);

    return params.translations.reduce(
      (acc, path) => acc.replace(path.text, path.translatedText),
      source
    );
  }
}
