import ExcelJS from 'exceljs';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const MAX_XLSX_COLUMN_NUMBER = 16384;

const getMergedMasterAddress = (cell: ExcelJS.Cell): string | null => {
  if (!cell.isMerged) {
    return null;
  }

  const master = cell.master;
  if (!master || master.address === cell.address) {
    return null;
  }

  return master.address;
};

const splitSelectionTokens = (raw?: string): string[] =>
  (raw ?? '')
    .split(/[,\n]/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

const normalizeComparableText = (value: string): string => value.trim().toLocaleLowerCase();

const parsePositiveInteger = (value: string | number | undefined): number | null => {
  if (value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return Math.floor(parsed);
};

const columnLettersToIndex = (letters: string): number | null => {
  const normalized = letters.replace(/\$/g, '').trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) {
    return null;
  }

  let result = 0;
  for (const char of normalized) {
    result = result * 26 + (char.charCodeAt(0) - 64);
  }

  return result > MAX_XLSX_COLUMN_NUMBER ? null : result;
};

const parseColumnEndpoint = (token: string): number | null => {
  const trimmed = token.trim();
  const numeric = parsePositiveInteger(trimmed);
  if (numeric !== null && /^\d+$/.test(trimmed)) {
    return numeric;
  }

  return columnLettersToIndex(trimmed);
};

const addColumnRange = (result: Set<number>, start: number, end: number): void => {
  const min = Math.min(start, end);
  const max = Math.max(start, end);
  for (let index = min; index <= max; index++) {
    result.add(index);
  }
};

const parseColumnToken = (token: string): number[] | null => {
  const normalized = token.replace(/\s+/g, '');
  const rangeMatch = /^([^:-]+)[:-]([^:-]+)$/.exec(normalized);
  if (rangeMatch) {
    const start = parseColumnEndpoint(rangeMatch[1]);
    const end = parseColumnEndpoint(rangeMatch[2]);
    if (start === null || end === null) {
      return null;
    }

    const result = new Set<number>();
    addColumnRange(result, start, end);
    return Array.from(result);
  }

  const single = parseColumnEndpoint(normalized);
  return single === null ? null : [single];
};

const findHeaderColumnIndexes = (headerCells: string[], token: string): number[] => {
  const normalizedToken = normalizeComparableText(token);
  return headerCells
    .map((header, index) => ({ header, columnNumber: index + 1 }))
    .filter(({ header }) => normalizeComparableText(header) === normalizedToken)
    .map(({ columnNumber }) => columnNumber);
};

export const resolveExcelColumnSelection = (
  raw: string | undefined,
  headerCells: string[]
): Set<number> | null => {
  const tokens = splitSelectionTokens(raw);
  if (tokens.length === 0) {
    return raw?.trim() ? new Set() : null;
  }

  const result = new Set<number>();
  for (const token of tokens) {
    const parsedColumns = parseColumnToken(token);
    if (parsedColumns) {
      parsedColumns.forEach((columnNumber) => result.add(columnNumber));
      continue;
    }

    findHeaderColumnIndexes(headerCells, token).forEach((columnNumber) => result.add(columnNumber));
  }

  return result;
};

export const shouldIncludeWorksheet = (
  worksheet: ExcelJS.Worksheet,
  worksheetIndex: number,
  includedSheets?: string,
  excludedSheets?: string
): boolean => {
  const includedTokens = splitSelectionTokens(includedSheets);
  const excludedTokens = splitSelectionTokens(excludedSheets);

  const matchesToken = (token: string): boolean => {
    const numeric = parsePositiveInteger(token);
    if (numeric !== null && /^\d+$/.test(token.trim())) {
      return numeric === worksheetIndex;
    }

    return normalizeComparableText(worksheet.name) === normalizeComparableText(token);
  };

  const isIncluded =
    includedTokens.length === 0 || includedTokens.some((token) => matchesToken(token));
  const isExcluded = excludedTokens.some((token) => matchesToken(token));

  return isIncluded && !isExcluded;
};

export const resolveExcelRowWindow = (options: {
  headerRowNumber?: string | number;
  startRowNumber?: string | number;
  skipFirstLine?: boolean;
}): { headerRowNumber: number | null; startRowNumber: number } => {
  const explicitHeaderRow = parsePositiveInteger(options.headerRowNumber);
  const legacyHeaderRow = options.skipFirstLine ? 1 : null;
  const headerRowNumber = explicitHeaderRow ?? legacyHeaderRow;
  const explicitStartRow = parsePositiveInteger(options.startRowNumber);

  return {
    headerRowNumber,
    startRowNumber: explicitStartRow ?? (headerRowNumber ? headerRowNumber + 1 : 1),
  };
};

export const buildWorksheetCellKey = (worksheetId: number, cellAddress: string): string =>
  `${worksheetId}:${cellAddress}`;

export const parseWorksheetCellKey = (
  key: string
): { worksheetId: number; cellAddress: string } => {
  const separatorIndex = key.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex === key.length - 1) {
    throw new Error(`잘못된 엑셀 셀 키입니다: ${key}`);
  }

  const worksheetId = Number(key.slice(0, separatorIndex));
  const cellAddress = key.slice(separatorIndex + 1);

  if (!Number.isFinite(worksheetId) || worksheetId <= 0) {
    throw new Error(`잘못된 워크시트 ID입니다: ${key}`);
  }

  return { worksheetId, cellAddress };
};

export const loadWorkbookFromBuffer = async (buffer: ArrayBuffer): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
};

export const workbookToBlob = async (workbook: ExcelJS.Workbook): Promise<Blob> => {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: XLSX_MIME_TYPE });
};

export const extractCellDisplayText = (cell: ExcelJS.Cell): string | null => {
  if (getMergedMasterAddress(cell)) {
    return null;
  }

  const value = cell.value;
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) {
    return null;
  }

  if (Array.isArray(value)) {
    return null;
  }

  if ('formula' in value || 'sharedFormula' in value) {
    return null;
  }

  if ('richText' in value) {
    return value.richText.map((part) => part.text).join('');
  }

  if ('text' in value && typeof value.text === 'string') {
    return value.text;
  }

  if ('result' in value && typeof value.result === 'string') {
    return value.result;
  }

  return null;
};

export const applyTranslatedCellText = (cell: ExcelJS.Cell, translatedText: string): void => {
  const value = cell.value;

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('richText' in value) {
      const fallbackFont = value.richText.find((part) => part.font)?.font;
      cell.value = {
        richText: [
          {
            text: translatedText,
            ...(fallbackFont ? { font: fallbackFont } : {}),
          },
        ],
      };
      return;
    }

    if ('hyperlink' in value) {
      cell.value = {
        ...value,
        text: translatedText,
      };
      return;
    }
  }

  cell.value = translatedText;
};
