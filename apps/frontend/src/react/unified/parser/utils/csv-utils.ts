const shouldQuote = (cell: string, delimiter: string): boolean => {
  return cell.includes(delimiter) || cell.includes('"') || cell.includes('\n');
};

/**
 * 간단한 CSV 라인 파서 (따옴표 이스케이프 옵션 지원)
 * - 구분자와 줄바꿈은 따옴표 안에서 무시
 * - 따옴표 안의 이중 따옴표("")는 하나의 따옴표로 변환
 */
export const parseCsvLine = (
  line: string,
  delimiter: string,
  useQuoteEscaping: boolean
): string[] => {
  if (!useQuoteEscaping) {
    return line.split(delimiter);
  }

  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const isEscapedQuote = inQuotes && line[i + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        i++; // skip next quote
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && line.startsWith(delimiter, i)) {
      cells.push(current);
      current = '';
      i += delimiter.length - 1;
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
};

/**
 * CSV 전체 콘텐츠 파서 (줄바꿈 포함 셀 지원)
 */
export const parseCsvContent = (
  content: string,
  delimiter: string,
  useQuoteEscaping: boolean
): string[][] => {
  if (!useQuoteEscaping) {
    return content.split('\n').map((line) => parseCsvLine(line, delimiter, false));
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '"') {
      const isEscapedQuote = inQuotes && content[i + 1] === '"';
      if (isEscapedQuote) {
        currentCell += '"';
        i++; // skip next quote
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && content.startsWith(delimiter, i)) {
      currentRow.push(currentCell);
      currentCell = '';
      i += delimiter.length - 1;
      continue;
    }

    if (!inQuotes && char === '\n') {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);

  return rows;
};

/**
 * CSV 셀을 문자열로 직렬화 (필요 시 따옴표 감싸기 및 이스케이프)
 */
export const stringifyCsvLine = (
  cells: string[],
  delimiter: string,
  useQuoteEscaping: boolean
): string => {
  if (!useQuoteEscaping) {
    return cells.join(delimiter);
  }

  const serializeCell = (cell: string) => {
    if (!shouldQuote(cell, delimiter)) return cell;
    const escaped = cell.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  return cells.map(serializeCell).join(delimiter);
};
