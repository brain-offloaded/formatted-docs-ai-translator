import rfdc from 'rfdc';

const clone = rfdc();

export const deepClone = <T>(obj: T): T => {
  return clone(obj);
};
