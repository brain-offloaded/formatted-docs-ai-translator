import ExcelJS from 'exceljs';
import { ExcelApplier } from '@/react/unified/applier/excel-applier';
import { SpreadsheetParserOptionsDto } from '@/react/unified/domain/options/spreadsheet-parser-options.dto';
import { TranslationInput } from '@/react/unified/domain/translation-input';
import { ExcelParser } from '@/react/unified/parser/excel-parser';
import type { AiTranslatorConfig } from '@/react/types/config';

const parser = new ExcelParser();
const applier = new ExcelApplier();
const dummyConfig = {} as AiTranslatorConfig;
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const createWorkbookFile = async (workbook: ExcelJS.Workbook, name = 'sample.xlsx') => {
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name, { type: XLSX_MIME_TYPE });
};

const loadWorkbookFromResult = async (blob: Blob) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await blob.arrayBuffer());
  return workbook;
};

const expectWorksheet = (
  worksheet: ExcelJS.Worksheet | undefined,
  name: string
): ExcelJS.Worksheet => {
  expect(worksheet).toBeDefined();
  if (!worksheet) {
    throw new Error(`워크시트를 찾을 수 없습니다: ${name}`);
  }
  return worksheet;
};

const buildInput = (file: File, options: Partial<SpreadsheetParserOptionsDto> = {}) => {
  const baseOptions: SpreadsheetParserOptionsDto = {
    isFile: true,
  };

  return new TranslationInput(file, { ...baseOptions, ...options }, dummyConfig);
};

describe('Excel 파이프라인', () => {
  it('기본값에서는 모든 시트의 문자열 셀을 번역 대상으로 삼는다', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet1 = workbook.addWorksheet('First');
    sheet1.addRow(['header', 'value']);
    sheet1.addRow([1, 'hello']);

    const sheet2 = workbook.addWorksheet('Second');
    sheet2.addRow(['key', 'text']);
    sheet2.addRow(['a', 'world']);

    const input = buildInput(await createWorkbookFile(workbook));
    const parsed = await parser.parse(input);

    expect(parsed.map((unit) => unit.key)).toEqual([
      '1:A1',
      '1:B1',
      '1:B2',
      '2:A1',
      '2:B1',
      '2:A2',
      '2:B2',
    ]);
  });

  it('셀 값만 바꾸고 시트 서식과 열 너비를 보존한다', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.columns = [
      { key: 'title', width: 28 },
      { key: 'status', width: 14 },
    ];
    worksheet.getCell('A1').value = '제목';
    worksheet.getCell('B1').value = '상태';
    worksheet.getCell('A2').value = '안녕하세요';
    worksheet.getCell('B2').value = '진행 중';
    worksheet.getCell('A2').font = { name: 'Arial', bold: true, color: { argb: 'FFFF0000' } };
    worksheet.getCell('A2').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFCC' },
    };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    const input = buildInput(await createWorkbookFile(workbook), { skipFirstLine: true });
    const parsed = await parser.parse(input);
    expect(parsed.map((unit) => unit.key)).toEqual(['1:A2', '1:B2']);

    const translated = parsed.map((unit) => ({ ...unit, target: `${unit.source}-tr` }));
    const applied = await applier.apply(input, translated);
    const [result] = applied.getResults();

    expect(result.success).toBe(true);
    expect(result.result).toBeInstanceOf(Blob);

    const outputWorkbook = await loadWorkbookFromResult(result.result as Blob);
    const outputSheet = expectWorksheet(outputWorkbook.getWorksheet(1), '1');
    const translatedCell = outputSheet.getCell('A2');

    expect(outputSheet.getColumn(1).width).toBe(28);
    expect(translatedCell.value).toBe('안녕하세요-tr');
    expect(translatedCell.font).toMatchObject({
      name: 'Arial',
      bold: true,
      color: { argb: 'FFFF0000' },
    });
    expect(translatedCell.fill).toMatchObject({
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFCC' },
    });
    expect(translatedCell.alignment).toMatchObject({ horizontal: 'center' });
  });

  it('시트 포함/제외와 헤더 행/시작 행을 조합해 번역 범위를 제한한다', async () => {
    const workbook = new ExcelJS.Workbook();
    const intro = workbook.addWorksheet('Intro');
    intro.addRow(['이 안내 시트는 제외']);
    intro.addRow(['번역되면 안 됨']);

    const dialog = workbook.addWorksheet('Dialog');
    dialog.addRow(['파일 설명']);
    dialog.addRow(['key', 'source_text', 'note']);
    dialog.addRow(['a', '안녕하세요', '첫 줄']);
    dialog.addRow(['b', '다음 문장', '둘째 줄']);

    const glossary = workbook.addWorksheet('Glossary');
    glossary.addRow(['key', 'source_text']);
    glossary.addRow(['term', '용어']);

    const input = buildInput(await createWorkbookFile(workbook), {
      sheets: 'Dialog, Glossary',
      excludedSheets: '3',
      headerRowNumber: '2',
      startRowNumber: '3',
      targetColumns: 'source_text',
    });

    const parsed = await parser.parse(input);

    expect(parsed.map((unit) => unit.key)).toEqual(['2:B3', '2:B4']);
    expect(parsed.map((unit) => unit.source)).toEqual(['안녕하세요', '다음 문장']);
  });

  it('Excel 열 문자/범위/번호/헤더명과 제외 열을 함께 적용한다', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet1 = workbook.addWorksheet('First');
    sheet1.addRow(['id', 'name', 'note', 'memo', 'ignore']);
    sheet1.addRow([1, 'Alice', 'hello', 'memo text', 'keep']);

    const sheet2 = workbook.addWorksheet('Second');
    sheet2.addRow(['id', 'name', 'note', 'memo', 'ignore']);
    sheet2.addRow([2, 'Bob', 'bye', 'memo too', 'keep too']);

    const input = buildInput(await createWorkbookFile(workbook), {
      headerRowNumber: '1',
      targetColumns: 'B:C, 4, memo',
      excludedColumns: 'name, E',
    });

    const parsed = await parser.parse(input);
    expect(parsed.map((unit) => unit.key)).toEqual(['1:C2', '1:D2', '2:C2', '2:D2']);

    const translated = parsed.map((unit) => ({ ...unit, target: `${unit.source}!` }));
    const applied = await applier.apply(input, translated);
    const outputWorkbook = await loadWorkbookFromResult(applied.getResult() as Blob);
    const firstSheet = expectWorksheet(outputWorkbook.getWorksheet('First'), 'First');
    const secondSheet = expectWorksheet(outputWorkbook.getWorksheet('Second'), 'Second');

    expect(firstSheet.getCell('B2').value).toBe('Alice');
    expect(firstSheet.getCell('C2').value).toBe('hello!');
    expect(firstSheet.getCell('D2').value).toBe('memo text!');
    expect(firstSheet.getCell('E2').value).toBe('keep');
    expect(secondSheet.getCell('B2').value).toBe('Bob');
    expect(secondSheet.getCell('C2').value).toBe('bye!');
    expect(secondSheet.getCell('D2').value).toBe('memo too!');
    expect(secondSheet.getCell('E2').value).toBe('keep too');
  });

  it('수식/병합/하이퍼링크/숨김 행열을 안전하게 처리한다', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.getCell('A1').value = 'title';
    worksheet.getCell('B1').value = 'link';
    worksheet.getCell('C1').value = 'hidden_column';
    worksheet.getCell('D1').value = 'merged';
    worksheet.getCell('A2').value = { formula: '1+1', result: 2 };
    worksheet.getCell('B2').value = {
      text: 'OpenAI',
      hyperlink: 'https://openai.com',
      tooltip: 'site',
    };
    worksheet.getCell('C2').value = '숨김 열';
    worksheet.getColumn(3).hidden = true;
    worksheet.getCell('D2').value = '병합 셀';
    worksheet.mergeCells('D2:E2');
    worksheet.getCell('A3').value = '숨김 행';
    worksheet.getRow(3).hidden = true;

    const input = buildInput(await createWorkbookFile(workbook), {
      headerRowNumber: 1,
      targetColumns: 'A:E',
      skipHiddenRowsColumns: true,
    });

    const parsed = await parser.parse(input);
    expect(parsed.map((unit) => unit.key)).toEqual(['1:B2', '1:D2']);

    const translated = parsed.map((unit) => ({
      ...unit,
      target: unit.key === '1:B2' ? '오픈에이아이' : 'Merged cell',
    }));
    const applied = await applier.apply(input, translated);
    const outputWorkbook = await loadWorkbookFromResult(applied.getResult() as Blob);
    const outputSheet = expectWorksheet(outputWorkbook.getWorksheet(1), '1');

    expect(outputSheet.getCell('A2').value).toMatchObject({
      formula: '1+1',
      result: 2,
    });
    expect(outputSheet.getCell('B2').value).toMatchObject({
      text: '오픈에이아이',
      hyperlink: 'https://openai.com',
    });
    expect(outputSheet.getCell('C2').value).toBe('숨김 열');
    expect(outputSheet.getColumn(3).hidden).toBe(true);
    expect(outputSheet.getCell('D2').value).toBe('Merged cell');
    expect(outputSheet.getCell('E2').master.address).toBe('D2');
    expect(outputSheet.getCell('A3').value).toBe('숨김 행');
    expect(outputSheet.getRow(3).hidden).toBe(true);
  });

  it('세그먼트 strict 실패가 있으면 파일 전체를 실패 처리한다', async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    worksheet.addRow(['value']);
    worksheet.addRow(['hello']);

    const input = buildInput(await createWorkbookFile(workbook));
    const parsed = await parser.parse(input);

    const translated = parsed.map((unit) => ({
      ...unit,
      target: `${unit.source}-tr`,
      strictFailed: true,
      strictFailureReasons: ['placeholder_mismatch'],
    }));

    const applied = await applier.apply(input, translated);
    const [result] = applied.getResults();

    expect(result.success).toBe(false);
    expect(result.message).toContain('세그먼트 번역 실패');
    expect(result.originalFileName).toBe('sample.xlsx');
  });
});
