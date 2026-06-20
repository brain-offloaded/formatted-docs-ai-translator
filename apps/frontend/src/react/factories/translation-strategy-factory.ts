import { TranslationStrategy } from '../unified/domain/translation-strategy';
import { PlainTextParser } from '../unified/parser/plain-text-parser';
import { PlainTextApplier } from '../unified/applier/plain-text-applier';
import { JsonParser } from '../unified/parser/json-parser';
import { JsonApplier } from '../unified/applier/json-applier';
import { SubtitleParser } from '../unified/parser/subtitle-parser';
import { SubtitleApplier } from '../unified/applier/subtitle-applier';
import { ImageParser } from '../unified/parser/image-parser';
import { ImageApplier } from '../unified/applier/image-applier';
import { TextArrayTranslator } from '../unified/translator/text-array-translator';
import { ImageTranslator } from '../unified/translator/image-translator';
import { CsvParser } from '../unified/parser/csv-parser';
import { CsvApplier } from '../unified/applier/csv-applier';
import { ExcelParser } from '../unified/parser/excel-parser';
import { ExcelApplier } from '../unified/applier/excel-applier';
import { TranslationType } from '../contexts/TranslationContext';

export const translationStrategyFactory = {
  create(type: TranslationType): TranslationStrategy {
    switch (type) {
      case TranslationType.Text:
        return {
          parser: new PlainTextParser(),
          translator: new TextArrayTranslator(),
          applier: new PlainTextApplier(),
        };
      case TranslationType.Json:
        return {
          parser: new JsonParser(),
          translator: new TextArrayTranslator(),
          applier: new JsonApplier(),
        };
      case TranslationType.Subtitle: {
        const parser = new SubtitleParser();
        return {
          parser,
          translator: new TextArrayTranslator(),
          applier: new SubtitleApplier(parser),
        };
      }
      case TranslationType.Image:
        return {
          parser: new ImageParser(),
          translator: new ImageTranslator(),
          applier: new ImageApplier(),
        };
      case TranslationType.Csv:
        return {
          parser: new CsvParser(),
          applier: new CsvApplier(),
          translator: new TextArrayTranslator(),
        };
      case TranslationType.Excel:
        return {
          parser: new ExcelParser(),
          applier: new ExcelApplier(),
          translator: new TextArrayTranslator(),
        };
      default:
        throw new Error(`Unsupported translation type: ${type}`);
    }
  },
};
