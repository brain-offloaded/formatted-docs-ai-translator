// 중첩 객체까지 완전히 동결시키는 함수
export const deepFreeze = <T>(obj: T): Readonly<T> => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  Object.freeze(obj);

  if (Array.isArray(obj)) {
    obj.forEach(deepFreeze);
  } else {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as Record<string, unknown>)[prop];
      if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        deepFreeze(value);
      }
    });
  }

  return obj;
};
