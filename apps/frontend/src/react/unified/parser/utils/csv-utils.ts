import Papa from 'papaparse';

/**
 * CSV 전체 콘텐츠 파서 (줄바꿈 포함 셀 지원)
 */
export const parseCsvContent = (content: string, delimiter: string): string[][] => {
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
export const stringifyCsvContent = (rows: string[][], delimiter: string): string => {
  return Papa.unparse(rows, {
    delimiter,
    newline: '\n',
  });
};
