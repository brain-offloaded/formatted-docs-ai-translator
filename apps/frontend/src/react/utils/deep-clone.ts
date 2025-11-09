export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof Array) {
    const newArr = [];
    for (let i = 0; i < obj.length; i++) {
      newArr[i] = deepClone(obj[i]);
    }
    return newArr as T;
  }

  if (obj instanceof Object) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return newObj as T;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}
