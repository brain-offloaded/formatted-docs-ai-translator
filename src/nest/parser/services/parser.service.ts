import { Inject, Injectable } from '@nestjs/common';

import { SimpleTranslatedTextPath, SimpleTextPath } from '../../../types/common';
import { BaseParserService } from './base-parser-service';
import { BaseParseOptionsDto } from '../dto/options/base-parse-options.dto';

export const PARSER_MAP = 'PARSER_MAP';

@Injectable()
export class ParserService {
  constructor(
    @Inject(PARSER_MAP)
    private readonly parsers: Map<string, BaseParserService<unknown, BaseParseOptionsDto>>
  ) {}

  private getParser(type: string): BaseParserService<unknown, BaseParseOptionsDto> {
    const parser = this.parsers.get(type);
    if (!parser) {
      throw new Error(`Unsupported file type: ${type}`);
    }
    return parser;
  }

  public async getTranslationTargets(
    type: string,
    content: string,
    options: BaseParseOptionsDto
  ): Promise<SimpleTextPath[]> {
    const parser = this.getParser(type);
    return await parser.getTranslationTargets({ source: content, options });
  }

  public async applyTranslation(
    type: string,
    content: string,
    translations: SimpleTranslatedTextPath[],
    options: BaseParseOptionsDto
  ): Promise<unknown> {
    const parser = this.getParser(type);
    return await parser.applyTranslation({ source: content, translations, options });
  }
}
