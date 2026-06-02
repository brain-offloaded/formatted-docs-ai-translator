import ExcelJS from 'exceljs';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
