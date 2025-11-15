#!/usr/bin/env node
/**
 * i18n 번역 파일 키 동기화 검증 스크립트
 *
 * 모든 언어 파일(ko.json, en.json 등)이 동일한 키 구조를 가지는지 확인합니다.
 * - 누락된 키 감지
 * - 추가 키 감지
 * - 중첩 구조 검증
 *
 * 사용법:
 *   yarn validate:i18n
 *   yarn validate:i18n --fix  (누락된 키를 자동으로 추가)
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(__dirname, '../apps/frontend/src/react/locales');
const BASE_LOCALE = 'ko'; // 기준 언어 (이 언어를 기준으로 다른 언어를 검증)

interface ValidationResult {
  missingKeys: string[];
  extraKeys: string[];
}

type JsonObject = { [key: string]: unknown };

/**
 * 객체를 평탄화하여 모든 키를 점(.) 표기법으로 변환
 * 예: { a: { b: 1 } } -> ['a.b']
 */
function flattenKeys(obj: JsonObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys.push(...flattenKeys(obj[key] as unknown as JsonObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

/**
 * 두 키 세트를 비교하여 누락/추가된 키를 찾음
 */
function compareKeys(baseKeys: string[], targetKeys: string[]): ValidationResult {
  const baseSet = new Set(baseKeys);
  const targetSet = new Set(targetKeys);

  const missingKeys = baseKeys.filter((key) => !targetSet.has(key));
  const extraKeys = targetKeys.filter((key) => !baseSet.has(key));

  return { missingKeys, extraKeys };
}

/**
 * 점 표기법 키를 기반으로 중첩 객체에서 값 가져오기
 */
function getValueByPath(obj: JsonObject, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object') {
      return (current as JsonObject)[key];
    }
    return undefined;
  }, obj);
}

/**
 * 점 표기법 키를 기반으로 중첩 객체에 값 설정
 */
function setValueByPath(obj: JsonObject, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current: JsonObject, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key] as JsonObject;
  }, obj);

  target[lastKey] = value;
}

/**
 * 누락된 키를 자동으로 추가 (기준 언어의 값으로 TODO 마커와 함께)
 */
function fixMissingKeys(
  targetFile: string,
  targetData: JsonObject,
  baseData: JsonObject,
  missingKeys: string[]
): void {
  for (const key of missingKeys) {
    const baseValue = getValueByPath(baseData, key);
    const todoValue = `[TODO] ${baseValue}`;
    setValueByPath(targetData, key, todoValue);
  }

  fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2) + '\n', 'utf-8');
  console.log(`✅ ${path.basename(targetFile)}: ${missingKeys.length}개의 누락된 키 추가됨`);
}

/**
 * 메인 검증 로직
 */
function validateI18nKeys(autoFix = false): boolean {
  console.log('🔍 i18n 키 동기화 검증 시작...\n');

  // 모든 JSON 파일 찾기
  const files = fs.readdirSync(LOCALES_DIR).filter((file) => file.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ 언어 파일을 찾을 수 없습니다.');
    return false;
  }

  const baseFile = `${BASE_LOCALE}.json`;
  if (!files.includes(baseFile)) {
    console.error(`❌ 기준 언어 파일(${baseFile})을 찾을 수 없습니다.`);
    return false;
  }

  // 기준 언어 파일 로드
  const baseFilePath = path.join(LOCALES_DIR, baseFile);
  const baseData = JSON.parse(fs.readFileSync(baseFilePath, 'utf-8'));
  const baseKeys = flattenKeys(baseData);

  console.log(`📋 기준 언어: ${BASE_LOCALE}`);
  console.log(`📊 총 키 개수: ${baseKeys.length}\n`);

  let hasErrors = false;

  // 다른 언어 파일들과 비교
  for (const file of files) {
    if (file === baseFile) continue;

    const targetFilePath = path.join(LOCALES_DIR, file);
    const targetData = JSON.parse(fs.readFileSync(targetFilePath, 'utf-8'));
    const targetKeys = flattenKeys(targetData);

    const { missingKeys, extraKeys } = compareKeys(baseKeys, targetKeys);

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${file}: 모든 키가 동기화되어 있습니다.`);
      continue;
    }

    hasErrors = true;
    console.log(`\n⚠️  ${file}:`);

    if (missingKeys.length > 0) {
      console.log(`  ❌ 누락된 키 (${missingKeys.length}개):`);
      missingKeys.slice(0, 10).forEach((key) => console.log(`     - ${key}`));
      if (missingKeys.length > 10) {
        console.log(`     ... 외 ${missingKeys.length - 10}개`);
      }

      if (autoFix) {
        fixMissingKeys(targetFilePath, targetData, baseData, missingKeys);
      }
    }

    if (extraKeys.length > 0) {
      console.log(`  ⚠️  추가된 키 (${extraKeys.length}개):`);
      extraKeys.slice(0, 10).forEach((key) => console.log(`     - ${key}`));
      if (extraKeys.length > 10) {
        console.log(`     ... 외 ${extraKeys.length - 10}개`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  if (!hasErrors) {
    console.log('✅ 모든 언어 파일이 동기화되어 있습니다!');
    return true;
  }

  if (autoFix) {
    console.log('✅ 누락된 키가 자동으로 추가되었습니다.');
    console.log('⚠️  [TODO] 마커가 있는 번역을 확인하고 수정해주세요.');
    return true;
  }

  console.log('❌ 언어 파일 간 키 불일치가 발견되었습니다.');
  console.log('\n💡 자동 수정하려면: yarn validate:i18n --fix');
  return false;
}

// 실행
const autoFix = process.argv.includes('--fix');
const success = validateI18nKeys(autoFix);

process.exit(success ? 0 : 1);
