export const errorToString = (error: unknown) => {
  return JSON.stringify(error, Object.getOwnPropertyNames(error));
};
