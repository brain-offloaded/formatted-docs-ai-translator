import { SimpleTextPath, SimpleTranslatedTextPath } from '@/types/common';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';

import { BaseParserService } from './base-parser-service';
import { CsvParserOptionsDto } from '@/nest/parser/dto/options/csv-parser-options.dto';

@Injectable()
export class CsvParserService extends BaseParserService<string, CsvParserOptionsDto> {
  readonly type = 'csv';

  /**
   * 파일 경로로부터 CSV 파일을 읽어 문자열로 반환합니다.
   */
  public async readFile(filePath: string, options: CsvParserOptionsDto): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.readString(content, options);
  }

  /**
   * CSV 문자열을 그대로 반환합니다.
   */
  public async readString(content: string, _options: CsvParserOptionsDto): Promise<string> {
    return content;
  }

  /**
   * CSV 파일에서 번역 대상을 추출합니다.
   * 각 행을 분석하여 번역이 필요한 텍스트를 식별합니다.
   */
  public async getTranslationTargets(params: {
    source: string;
    options: CsvParserOptionsDto;
  }): Promise<SimpleTextPath[]> {
    // read 메서드를 사용하여 source를 TargetFormat(string)으로 변환
    const text = await this.read(params);

    // 줄 단위로 분리
    const lines = text.split('\n');
    const result: SimpleTextPath[] = [];

    // 각 줄마다 처리
    lines.forEach((line, index) => {
      // 첫 번째 줄 건너뛰기 옵션이 활성화되어 있고 첫 번째 줄인 경우 건너뜀
      if (params.options.skipFirstLine && index === 0) return;
      if (!line.trim()) return; // 빈 줄 무시

      // 구분자로 분리
      const cells = line.split(params.options.delimiter);

      // 각 셀에 대해 번역 대상 추가
      cells.forEach((cell, cellIndex) => {
        const cellContent = cell.trim();
        if (cellContent) {
          result.push({
            text: cellContent,
            path: `${index},${cellIndex}`, // 행,열 형식으로 위치 저장
          });
        }
      });
    });

    return result;
  }

  /**
   * 번역된 내용을 CSV 파일에 적용합니다.
   * 각 셀의 위치를 추적하여 원본 텍스트를 번역된 텍스트로 대체합니다.
   * 번역된 텍스트 내에 구분자가 포함되어 있을 경우 replaceDelimiter로 대체합니다.
   */
  public async applyTranslation(params: {
    source: string;
    translations: SimpleTranslatedTextPath[];
    options: CsvParserOptionsDto;
  }): Promise<string> {
    // read 메서드를 사용하여 source를 TargetFormat(string)으로 변환
    const text = await this.read(params);
    const { delimiter, replaceDelimiter, skipFirstLine } = params.options;

    // 줄 단위로 분리
    const lines = text.split('\n');

    // 번역된 내용을 위치에 맞게 적용
    params.translations.forEach((item) => {
      const [rowIndex, colIndex] = item.path.split(',').map(Number);

      // skipFirstLine 옵션이 활성화된 경우 첫 번째 줄은 건너뜀
      if (skipFirstLine && rowIndex === 0) return;

      if (lines[rowIndex]) {
        const cells = lines[rowIndex].split(delimiter);

        if (cells[colIndex]) {
          // 원본 셀 내용과 일치하는지 확인
          const trimmedCell = cells[colIndex].trim();
          if (trimmedCell === item.text) {
            // 번역된 텍스트에서 구분자를 대체
            let processedTranslation = item.translatedText;
            if (replaceDelimiter && delimiter) {
              processedTranslation = processedTranslation.replaceAll(delimiter, replaceDelimiter);
            }

            cells[colIndex] = cells[colIndex].replace(trimmedCell, processedTranslation);
          }
        }

        // 줄 업데이트 - 원래 구분자로 셀을 결합
        lines[rowIndex] = cells.join(delimiter);
      }
    });

    return lines.join('\n');
  }
}
