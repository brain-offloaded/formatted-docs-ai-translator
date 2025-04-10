import { Injectable } from '@nestjs/common';

import { TextPath, TranslatedTextPath } from '../../../types/common';
import { deepClone } from '../../../utils/deep-clone';
import { deepFreeze } from '../../../utils/deep-freeze';
import { isLanguage } from '../../../utils/language';
import { IParserService } from './i-parser-service';
import { JsonParserOptionsDto } from '@/nest/parser/dto/options/json-parser-options.dto';

@Injectable()
export class JsonParserService
  implements
    IParserService<Record<string, unknown>, JsonParserOptionsDto, TextPath, TranslatedTextPath>
{
  public getTranslationTargets(
    json: Record<string, unknown>,
    options: JsonParserOptionsDto
  ): TextPath[] {
    const frozenJson = deepFreeze(deepClone(json));
    return this.traverseJson(frozenJson, '', options);
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

  public applyTranslation(
    json: Record<string, unknown>,
    translatedTextPaths: TranslatedTextPath[],
    _options: JsonParserOptionsDto
  ): Record<string, unknown> {
    // 원본 JSON이 수정되지 않도록 깊은 복사 수행
    const result = deepClone(json);

    // 각 번역된 텍스트에 대해 처리
    for (const { path, translatedText } of translatedTextPaths) {
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
