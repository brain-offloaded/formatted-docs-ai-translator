import Papa from 'papaparse';

const parseLineNaively = (line: string, delimiter: string): string[] => line.split(delimiter);

/**
 * CSV 전체 콘텐츠 파서 (줄바꿈 포함 셀 지원)
 */
export const parseCsvContent = (
  content: string,
  delimiter: string,
  useQuoteEscaping: boolean
): string[][] => {
  if (!useQuoteEscaping) {
    return content.split('\n').map((line) => parseLineNaively(line, delimiter));
  }

  const { data } = Papa.parse<string[]>(content, {
    delimiter,
    newline: '\n',
    skipEmptyLines: false,
    dynamicTyping: false,
  });

  return data as string[][];
};

/**
 * CSV 콘텐츠 직렬화 (필요 시 따옴표 이스케이프 포함)
 */
export const stringifyCsvContent = (
  rows: string[][],
  delimiter: string,
  useQuoteEscaping: boolean
): string => {
  if (!useQuoteEscaping) {
    return rows.map((cells) => cells.join(delimiter)).join('\n');
  }

  return Papa.unparse(rows, {
    delimiter,
    newline: '\n',
  });
};
