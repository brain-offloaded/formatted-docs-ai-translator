import { TextPath, TranslatedTextPath } from '@/types/common';
import { Injectable } from '@nestjs/common';

import { IParserService } from './i-parser-service';
import { PlainTextParserOptionsDto } from '@/nest/parser/dto/options/plain-text-parser-options.dto';

@Injectable()
export class PlainTextParserService implements IParserService<string, PlainTextParserOptionsDto> {
  public getTranslationTargets(text: string, _options: PlainTextParserOptionsDto): TextPath[] {
    return text.split('\n').map((line) => ({ text: line.trim(), path: '' }));
  }

  public applyTranslation(
    text: string,
    translatedTextPaths: TranslatedTextPath[],
    _options: PlainTextParserOptionsDto
  ): string {
    return translatedTextPaths.reduce(
      (acc, path) => acc.replace(path.text, path.translatedText),
      text
    );
  }
}
