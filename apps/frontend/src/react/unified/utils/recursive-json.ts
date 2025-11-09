import { get, set } from 'lodash';

export interface RecursiveJsonUnwrapResult {
  value: unknown;
  stringifiedPaths: string[];
}

const isLikelyJsonStructure = (value: string): boolean => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }
  const firstChar = trimmed[0];
  return firstChar === '{' || firstChar === '[';
};

const tryParseJson = (value: string): unknown | undefined => {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

const unwrapValue = (value: unknown, path: string, stringifiedPaths: Set<string>): unknown => {
  if (typeof value === 'string' && isLikelyJsonStructure(value)) {
    const parsed = tryParseJson(value);
    if (parsed !== undefined && parsed !== null && typeof parsed === 'object') {
      stringifiedPaths.add(path);
      return unwrapValue(parsed, path, stringifiedPaths);
    }
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => unwrapValue(item, `${path}[${index}]`, stringifiedPaths));
  }

  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const childPath = path ? `${path}.${key}` : key;
      result[key] = unwrapValue(
        (value as Record<string, unknown>)[key],
        childPath,
        stringifiedPaths
      );
    }
    return result;
  }

  return value;
};

export const unwrapStringifiedJsonValues = (
  value: unknown,
  enableRecursiveParse: boolean
): RecursiveJsonUnwrapResult => {
  if (!enableRecursiveParse) {
    return { value, stringifiedPaths: [] };
  }

  const stringifiedPaths = new Set<string>();
  const unwrapped = unwrapValue(value, '', stringifiedPaths);

  return {
    value: unwrapped,
    stringifiedPaths: Array.from(stringifiedPaths),
  };
};

export const rewrapStringifiedJsonValues = (
  value: unknown,
  stringifiedPaths: string[]
): unknown => {
  if (stringifiedPaths.length === 0) {
    return value;
  }

  const sortedPaths = [...stringifiedPaths].sort((a, b) => b.length - a.length);
  let result: unknown = value;

  for (const path of sortedPaths) {
    if (path === '') {
      result = JSON.stringify(result);
      continue;
    }

    if (typeof result !== 'object' || result === null) {
      continue;
    }

    const currentValue = get(result, path);
    if (currentValue === undefined) {
      continue;
    }

    set(result as Record<string, unknown>, path, JSON.stringify(currentValue));
  }

  return result;
};
