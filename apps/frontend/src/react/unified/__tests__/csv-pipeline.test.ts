import { CsvApplier } from '@/react/unified/applier/csv-applier';
import { CsvParser } from '@/react/unified/parser/csv-parser';
import { parseCsvContent } from '@/react/unified/parser/utils/csv-utils';
import { CsvParserOptionsDto } from '@/react/unified/domain/options/csv-parser-options.dto';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import type { AiTranslatorConfig } from '@/react/types/config';

const parser = new CsvParser();
const applier = new CsvApplier();
const dummyConfig = {} as AiTranslatorConfig;

const buildInput = (content: string, options: Partial<CsvParserOptionsDto> = {}) => {
  const baseOptions: CsvParserOptionsDto = {
    delimiter: ',',
    isFile: false,
  };

  return new TranslationInput(content, { ...baseOptions, ...options }, dummyConfig);
};

const translateAll = (sourceUnits: Awaited<ReturnType<typeof parser.parse>>) =>
  sourceUnits.map((unit) => ({ ...unit, target: `${unit.source}-tr` }));

describe('CSV 파이프라인', () => {
  it('따옴표 이스케이프를 사용해 줄바꿈/구분자가 포함된 셀을 안전하게 처리한다', async () => {
    const csv = ['header1,header2', '"first line\nsecond line",value2', 'plain,"needs,quote"'].join(
      '\n'
    );
    const input = buildInput(csv, { skipFirstLine: true });

    const parsed = await parser.parse(input);
    expect(parsed).toHaveLength(4);

    const applied = await applier.apply(input, translateAll(parsed));
    const result = (applied.getResult() as string) || '';
    const rows = parseCsvContent(result, ',');

    expect(rows[0]).toEqual(['header1', 'header2']);
    expect(rows[1]).toEqual(['first line\nsecond line-tr', 'value2-tr']);
    expect(rows[2]).toEqual(['plain-tr', 'needs,quote-tr']);
  });

  it('targetColumns와 skipFirstLine 옵션을 조합해 지정한 열만 번역한다', async () => {
    const csv = ['id|title|desc', '1|KEEP|translate me', '2|KEEP2|translate me too'].join('\n');
    const input = buildInput(csv, {
      delimiter: '|',
      skipFirstLine: true,
      targetColumns: '3',
    });

    const parsed = await parser.parse(input);
    expect(parsed.map((u) => u.key)).toEqual(['1,2', '2,2']);

    const translated = parsed.map((unit) => ({ ...unit, target: `${unit.source}!` }));
    const applied = await applier.apply(input, translated);
    const rows = parseCsvContent(applied.getResult() as string, '|');

    expect(rows[0]).toEqual(['id', 'title', 'desc']); // 헤더 보존
    expect(rows[1]).toEqual(['1', 'KEEP', 'translate me!']); // 지정 열만 치환
    expect(rows[2]).toEqual(['2', 'KEEP2', 'translate me too!']);
  });

  it('replaceDelimiter로 구분자 충돌을 방지한다', async () => {
    const csv = ['a,b', 'c,d'].join('\n');
    const input = buildInput(csv, {
      replaceDelimiter: ';',
      skipFirstLine: false,
    });

    const parsed = await parser.parse(input);
    const translated = parsed.map((unit) => ({ ...unit, target: `${unit.source},x` }));
    const applied = await applier.apply(input, translated);

    const rows = parseCsvContent(applied.getResult() as string, ',');
    expect(rows).toEqual([
      ['a;x', 'b;x'],
      ['c;x', 'd;x'],
    ]);
  });
});
