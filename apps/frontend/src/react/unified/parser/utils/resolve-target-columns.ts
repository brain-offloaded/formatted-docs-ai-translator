import { parseCsvLine } from './csv-utils';

const splitColumns = (raw?: string) =>
  raw
    ?.split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

const parseNumericColumn = (token: string): number | null => {
  const parsed = Number.parseInt(token, 10);
  // 사용자는 1-based 인덱스를 입력하므로 0-based로 변환
  // 1 이상의 값만 유효 (0 이하는 무시)
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return parsed - 1; // 1-based → 0-based 변환
};

const findColumnIndexByHeader = (headers: string[], token: string): number | null => {
  const index = headers.findIndex((header) => header.trim() === token);
  if (index === -1) return null;
  return index;
};

export const resolveTargetColumns = (
  raw: string | undefined,
  lines: string[],
  delimiter: string,
  useQuoteEscaping: boolean
): Set<number> | null => {
  const tokens = splitColumns(raw);
  if (!tokens || tokens.length === 0) {
    return raw?.trim() ? new Set() : null;
  }

  const headerCells = lines[0] ? parseCsvLine(lines[0], delimiter, useQuoteEscaping) : [];
  const result = new Set<number>();

  tokens.forEach((token) => {
    const numeric = parseNumericColumn(token);
    if (numeric !== null) {
      result.add(numeric);
      return;
    }

    const headerIndex = findColumnIndexByHeader(headerCells, token);
    if (headerIndex !== null) {
      result.add(headerIndex);
    }
  });

  return result;
};
