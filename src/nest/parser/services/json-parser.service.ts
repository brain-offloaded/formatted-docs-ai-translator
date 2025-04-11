import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';

import { TextPath, TranslatedTextPath } from '../../../types/common';
import { deepClone } from '../../../utils/deep-clone';
import { deepFreeze } from '../../../utils/deep-freeze';
import { isLanguage } from '../../../utils/language';
import { BaseParserService } from './base-parser-service';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';

@Injectable()
export class JsonParserService extends BaseParserService<
  Record<string, unknown>,
  JsonParserOptionsDto,
  TextPath,
  TranslatedTextPath
> {
  /**
   * 파일 경로로부터 JSON 파일을 읽어 객체로 변환합니다.
   */
  public async readFile(
    filePath: string,
    options: JsonParserOptionsDto
  ): Promise<Record<string, unknown>> {
    const content = await fs.readFile(filePath, 'utf-8');
    return this.readString(content, options);
  }

  /**
   * JSON 문자열을 객체로 변환합니다.
   */
  public async readString(
    content: string,
    _options: JsonParserOptionsDto
  ): Promise<Record<string, unknown>> {
    return JSON.parse(content);
  }

  public async getTranslationTargets(params: {
    source: string;
    options: JsonParserOptionsDto;
    isFile: boolean;
  }): Promise<TextPath[]> {
    // read 메서드를 사용하여 source를 TargetFormat(Record<string, unknown>)으로 변환
    const json = await this.read(params);

    const frozenJson = deepFreeze(deepClone(json));
    return this.traverseJson(frozenJson, '', params.options);
  }

  private traverseJson(json: unknown, basePath: string, options: JsonParserOptionsDto): TextPath[] {
    const targets: TextPath[] = [];

    if (typeof json === 'string') {
      if (isLanguage(json, options.sourceLanguage)) {
        targets.push({ text: json, path: basePath });
      }
    } else if (typeof json === 'object' && json !== null) {
      if (Array.isArray(json)) {
        for (let i = 0; i < json.length; i++) {
          const childTargets = this.traverseJson(json[i], `${basePath}[${i}]`, options);
          targets.push(...childTargets);
        }
      } else {
        for (const key in json) {
          if (Object.prototype.hasOwnProperty.call(json, key)) {
            const value = (json as Record<string, unknown>)[key];
            const newPath = basePath ? `${basePath}.${key}` : key;
            const childTargets = this.traverseJson(value, newPath, options);
            targets.push(...childTargets);
          }
        }
      }
    }

    return targets;
  }

  private parsePath(path: string): (string | number)[] {
    if (!path.includes('.') && !path.includes('[')) {
      // 단순 속성 이름인 경우 (경로 구분자가 없는 경우)
      return [path];
    }

    const parts: (string | number)[] = [];
    let inBracket = false;
    let currentPart = '';
    let indexStr = '';

    for (let i = 0; i < path.length; i++) {
      const char = path[i];

      if (char === '.' && !inBracket) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
      } else if (char === '[' && !inBracket) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
        inBracket = true;
      } else if (char === ']' && inBracket) {
        if (indexStr) {
          // 배열 인덱스 추가
          parts.push(Number(indexStr));
          indexStr = '';
        }
        inBracket = false;
      } else if (inBracket) {
        // 배열 인덱스 문자 수집
        indexStr += char;
      } else {
        // 일반 속성 이름 수집
        currentPart += char;
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    return parts;
  }

  private setValueAtPath(obj: Record<string, unknown>, path: string, value: string): void {
    if (!path) return;

    // 특수 문자가 포함된 단일 키 처리 (경로 구분자가 없는 경우)
    if (!path.includes('.') && !path.includes('[')) {
      obj[path] = value;
      return;
    }

    // 경로가 배열 인덱스를 포함하는 경우와 일반 속성인 경우를 처리
    const pathParts = this.parsePath(path);

    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];

      if (typeof part === 'number') {
        // 배열 인덱스인 경우
        if (!Array.isArray(current)) return;
        if (part >= current.length) return;
        current = current[part] as Record<string, unknown>;
      } else {
        // 객체 속성인 경우
        if (!(current as Record<string, unknown>)[part]) return;
        current = (current as Record<string, unknown>)[part] as Record<string, unknown>;
      }
    }

    // 마지막 부분을 처리하여 값을 설정
    const lastPart = pathParts[pathParts.length - 1];
    if (typeof lastPart === 'number') {
      if (!Array.isArray(current)) return;
      if (lastPart >= current.length) return;
      current[lastPart] = value;
    } else {
      (current as Record<string, unknown>)[lastPart] = value;
    }
  }

  public async applyTranslation(params: {
    source: string;
    translations: TranslatedTextPath[];
    options: JsonParserOptionsDto;
    isFile: boolean;
  }): Promise<Record<string, unknown>> {
    // read 메서드를 사용하여 source를 TargetFormat(Record<string, unknown>)으로 변환
    const json = await this.read(params);

    // 원본 JSON이 수정되지 않도록 깊은 복사 수행
    const result = deepClone(json);

    // 각 번역된 텍스트에 대해 처리
    for (const { path, translatedText } of params.translations) {
      // 경로에 특수 문자가 포함되어 있지만 실제 객체 키인 경우 직접 접근
      if (Object.prototype.hasOwnProperty.call(result, path)) {
        result[path] = translatedText;
      } else {
        // 중첩된 경로인 경우 기존 로직 사용
        this.setValueAtPath(result, path, translatedText);
      }
    }

    return result;
  }
}
