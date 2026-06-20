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

const MAX_XLSX_ROW_NUMBER = 1048576;

const normalizeComparableText = (value: string): string => value.trim().toLocaleLowerCase();

const splitSelectionTokens = (raw?: string): string[] => {
  const source = raw ?? '';
  const tokens: string[] = [];
  let current = '';
  let inQuotedSheetName = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const nextChar = source[index + 1];

    if (char === "'" && nextChar === "'") {
      current += "''";
      index++;
      continue;
    }

    if (char === "'") {
      inQuotedSheetName = !inQuotedSheetName;
      current += char;
      continue;
    }

    if (!inQuotedSheetName && (char === ',' || char === '\n')) {
      const token = current.trim();
      if (token) {
        tokens.push(token);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const token = current.trim();
  if (token) {
    tokens.push(token);
  }

  return tokens;
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

const unquoteSheetName = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
};

const splitSheetReference = (token: string): { sheetName?: string; rangeReference: string } => {
  let inQuotedSheetName = false;

  for (let index = 0; index < token.length; index++) {
    const char = token[index];
    const nextChar = token[index + 1];

    if (char === "'" && nextChar === "'") {
      index++;
      continue;
    }

    if (char === "'") {
      inQuotedSheetName = !inQuotedSheetName;
      continue;
    }

    if (!inQuotedSheetName && char === '!') {
      return {
        sheetName: unquoteSheetName(token.slice(0, index)),
        rangeReference: token.slice(index + 1).trim(),
      };
    }
  }

  return { rangeReference: token.trim() };
};

const parseCellAddress = (raw: string): { rowNumber: number; columnNumber: number } | null => {
  const match = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(raw.trim());
  if (!match) {
    return null;
  }

  const columnNumber = columnLettersToIndex(match[1]);
  const rowNumber = Number.parseInt(match[2], 10);
  if (
    columnNumber === null ||
    !Number.isFinite(rowNumber) ||
    rowNumber < 1 ||
    rowNumber > MAX_XLSX_ROW_NUMBER
  ) {
    return null;
  }

  return { rowNumber, columnNumber };
};

const parseRowNumber = (raw: string): number | null => {
  if (!/^\d+$/.test(raw.trim())) {
    return null;
  }

  const parsed = Number.parseInt(raw.trim(), 10);
  return parsed >= 1 && parsed <= MAX_XLSX_ROW_NUMBER ? parsed : null;
};

interface ExcelRangeBounds {
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
}

const normalizeRangeBounds = (bounds: ExcelRangeBounds): ExcelRangeBounds => ({
  startRow: Math.min(bounds.startRow, bounds.endRow),
  endRow: Math.max(bounds.startRow, bounds.endRow),
  startColumn: Math.min(bounds.startColumn, bounds.endColumn),
  endColumn: Math.max(bounds.startColumn, bounds.endColumn),
});

const parseRangeBounds = (raw: string): ExcelRangeBounds | null => {
  const normalized = raw.replace(/\s+/g, '');
  if (!normalized) {
    return null;
  }

  const wholeColumnMatch = /^\$?([A-Za-z]{1,3})(?::\$?([A-Za-z]{1,3}))?$/.exec(normalized);
  if (wholeColumnMatch) {
    const startColumn = columnLettersToIndex(wholeColumnMatch[1]);
    const endColumn = columnLettersToIndex(wholeColumnMatch[2] ?? wholeColumnMatch[1]);
    if (startColumn === null || endColumn === null) {
      return null;
    }

    return normalizeRangeBounds({
      startRow: 1,
      endRow: MAX_XLSX_ROW_NUMBER,
      startColumn,
      endColumn,
    });
  }

  const wholeRowMatch = /^(\d+)(?::(\d+))$/.exec(normalized);
  if (wholeRowMatch) {
    const startRow = parseRowNumber(wholeRowMatch[1]);
    const endRow = parseRowNumber(wholeRowMatch[2]);
    if (startRow === null || endRow === null) {
      return null;
    }

    return normalizeRangeBounds({
      startRow,
      endRow,
      startColumn: 1,
      endColumn: MAX_XLSX_COLUMN_NUMBER,
    });
  }

  const cellRangeMatch = /^(\$?[A-Za-z]{1,3}\$?\d+)(?::(\$?[A-Za-z]{1,3}\$?\d+))?$/.exec(
    normalized
  );
  if (cellRangeMatch) {
    const startCell = parseCellAddress(cellRangeMatch[1]);
    const endCell = parseCellAddress(cellRangeMatch[2] ?? cellRangeMatch[1]);
    if (!startCell || !endCell) {
      return null;
    }

    return normalizeRangeBounds({
      startRow: startCell.rowNumber,
      endRow: endCell.rowNumber,
      startColumn: startCell.columnNumber,
      endColumn: endCell.columnNumber,
    });
  }

  return null;
};

const isCellInBounds = (cell: ExcelJS.Cell, bounds: ExcelRangeBounds): boolean => {
  const rowNumber = Number(cell.row);
  const columnNumber = Number(cell.col);

  return (
    rowNumber >= bounds.startRow &&
    rowNumber <= bounds.endRow &&
    columnNumber >= bounds.startColumn &&
    columnNumber <= bounds.endColumn
  );
};

const isSheetNameMatch = (worksheet: ExcelJS.Worksheet, token: string): boolean =>
  normalizeComparableText(worksheet.name) === normalizeComparableText(unquoteSheetName(token));

const matchesExcelSelectionToken = (
  worksheet: ExcelJS.Worksheet,
  cell: ExcelJS.Cell,
  token: string
) => {
  const { sheetName, rangeReference } = splitSheetReference(token);
  if (sheetName !== undefined) {
    if (!isSheetNameMatch(worksheet, sheetName)) {
      return false;
    }

    const bounds = parseRangeBounds(rangeReference);
    return bounds ? isCellInBounds(cell, bounds) : true;
  }

  if (isSheetNameMatch(worksheet, rangeReference)) {
    return true;
  }

  const bounds = parseRangeBounds(rangeReference);
  return bounds ? isCellInBounds(cell, bounds) : false;
};

export const shouldTranslateExcelCell = ({
  worksheet,
  cell,
  targetRanges,
  excludedRanges,
}: {
  worksheet: ExcelJS.Worksheet;
  cell: ExcelJS.Cell;
  targetRanges?: string;
  excludedRanges?: string;
}): boolean => {
  const targetTokens = splitSelectionTokens(targetRanges);
  const excludedTokens = splitSelectionTokens(excludedRanges);
  const isIncluded =
    targetTokens.length === 0 ||
    targetTokens.some((token) => matchesExcelSelectionToken(worksheet, cell, token));

  if (!isIncluded) {
    return false;
  }

  return !excludedTokens.some((token) => matchesExcelSelectionToken(worksheet, cell, token));
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
