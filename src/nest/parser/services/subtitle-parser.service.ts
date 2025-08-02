import { Injectable } from '@nestjs/common';
import { SimpleTextPath, SimpleTranslatedTextPath } from '@/types/common';
import { BaseParserService } from './base-parser-service';
import { SubtitleParserOptionsDto } from '@/nest/parser/dto/options/subtitle-parser-options.dto';
import { SubtitleFormatEnum } from '@/nest/parser/dto/options/subtitle-format.enum';
import { SubtitleBlock } from '../models/subtitle-block.interface';

/**
 * SRT/VTT 자막 파일을 파싱하는 서비스
 */
@Injectable()
export class SubtitleParserService extends BaseParserService<string, SubtitleParserOptionsDto> {
  readonly type = 'subtitle';

  /**
   * 자막 파일에서 번역 대상을 추출합니다.
   */
  public async getTranslationTargets(params: {
    source: string;
    options: SubtitleParserOptionsDto;
  }): Promise<SimpleTextPath[]> {
    const content = await this.read(params);
    const format = this.detectFormat(content, params.options.format);

    // 자막을 블록 단위로 분리
    const blocks = this.parseSubtitleBlocks(content, format);

    // 각 블록에서 텍스트 부분만 추출하여 번역 대상 목록 생성
    return blocks
      .filter((block) => block.text.trim().length > 0) // 빈 텍스트 블록 제외
      .map((block, index) => ({
        text: block.text,
        path: `subtitle.${index}`,
      }));
  }

  /**
   * 번역된 텍스트를 자막 파일에 적용합니다.
   */
  public async applyTranslation(params: {
    source: string;
    translations: SimpleTranslatedTextPath[];
    options: SubtitleParserOptionsDto;
  }): Promise<string> {
    const content = await this.read(params);
    const format = this.detectFormat(content, params.options.format);

    // 원본 자막을 블록 단위로 분리
    const blocks = this.parseSubtitleBlocks(content, format);

    // 번역된 텍스트를 원본 자막 블록에 적용
    let translationIndex = 0;
    const translatedBlocks = blocks.map((block) => {
      // 빈 텍스트 블록은 그대로 유지
      if (block.text.trim().length === 0) {
        return block;
      }

      const translation = params.translations[translationIndex++];
      if (translation) {
        return {
          ...block,
          text: translation.translatedText,
        };
      }
      return block;
    });

    // 번역된 블록을 다시 자막 형식으로 조합
    return this.formatSubtitleBlocks(translatedBlocks, format);
  }

  /**
   * 자막 형식을 자동으로 감지합니다.
   */
  private detectFormat(
    content: string,
    formatOption: SubtitleFormatEnum
  ): SubtitleFormatEnum.SRT | SubtitleFormatEnum.VTT {
    if (formatOption !== SubtitleFormatEnum.AUTO) {
      return formatOption as SubtitleFormatEnum.SRT | SubtitleFormatEnum.VTT;
    }

    // 자동 감지: VTT 헤더 확인
    if (content.trim().startsWith('WEBVTT')) {
      return SubtitleFormatEnum.VTT;
    }

    // 기본값은 SRT 형식으로 간주
    return SubtitleFormatEnum.SRT;
  }

  /**
   * 자막 파일을 블록 단위로 분리합니다.
   */
  private parseSubtitleBlocks(
    content: string,
    format: SubtitleFormatEnum.SRT | SubtitleFormatEnum.VTT
  ): SubtitleBlock[] {
    // 개행 문자 정규화
    const normalizedContent = content.replace(/\r\n/g, '\n');

    if (format === SubtitleFormatEnum.VTT) {
      return this.parseVttBlocks(normalizedContent);
    } else {
      return this.parseSrtBlocks(normalizedContent);
    }
  }

  /**
   * SRT 형식의 자막을 블록 단위로 분리합니다.
   */
  private parseSrtBlocks(content: string): SubtitleBlock[] {
    // SRT 블록은 빈 줄로 구분됨
    const blocks = content.split('\n\n').filter((block) => block.trim() !== '');

    return blocks.map((block) => {
      const lines = block.split('\n');

      // 첫 번째 줄은 인덱스, 두 번째 줄은 시간 정보
      const id = lines[0]?.trim() || '';
      const timeInfo = lines[1]?.trim() || '';

      // 나머지 줄은 텍스트
      const text = lines.slice(2).join('\n').trim();

      return {
        id,
        timeInfo,
        text,
        format: SubtitleFormatEnum.SRT,
      };
    });
  }

  /**
   * VTT 형식의 자막을 블록 단위로 분리합니다.
   */
  private parseVttBlocks(content: string): SubtitleBlock[] {
    // WEBVTT 헤더 제거
    const withoutHeader = content.replace(/^WEBVTT.*?\n\n/s, '');

    // VTT 블록은 빈 줄로 구분됨
    const blocks = withoutHeader.split('\n\n').filter((block) => block.trim() !== '');

    return blocks.map((block) => {
      const lines = block.split('\n');

      let id = '';
      let timeInfoIndex = 0;

      // ID 또는 시간 정보 확인
      if (lines[0] && !lines[0].includes('-->')) {
        id = lines[0].trim();
        timeInfoIndex = 1;
      }

      const timeInfo = lines[timeInfoIndex]?.trim() || '';
      const text = lines
        .slice(timeInfoIndex + 1)
        .join('\n')
        .trim();

      return {
        id,
        timeInfo,
        text,
        format: SubtitleFormatEnum.VTT,
      };
    });
  }

  /**
   * 번역된 블록을 자막 형식으로 조합합니다.
   */
  private formatSubtitleBlocks(
    blocks: SubtitleBlock[],
    format: SubtitleFormatEnum.SRT | SubtitleFormatEnum.VTT
  ): string {
    if (format === SubtitleFormatEnum.VTT) {
      return this.formatVttBlocks(blocks);
    } else {
      return this.formatSrtBlocks(blocks);
    }
  }

  /**
   * 번역된 블록을 SRT 형식으로 조합합니다.
   */
  private formatSrtBlocks(blocks: SubtitleBlock[]): string {
    return blocks
      .map((block) => {
        return `${block.id}\n${block.timeInfo}\n${block.text}`;
      })
      .join('\n\n');
  }

  /**
   * 번역된 블록을 VTT 형식으로 조합합니다.
   */
  private formatVttBlocks(blocks: SubtitleBlock[]): string {
    const header = 'WEBVTT\n\n';
    const content = blocks
      .map((block) => {
        if (block.id) {
          return `${block.id}\n${block.timeInfo}\n${block.text}`;
        }
        return `${block.timeInfo}\n${block.text}`;
      })
      .join('\n\n');

    return header + content;
  }
}
