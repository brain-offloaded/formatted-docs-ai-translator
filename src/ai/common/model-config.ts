export interface CommonModelConfig<T extends string> {
  modelName: T;
  requestsPerMinute: number;
  maxOutputTokenCount: number;
}

export type ThinkableModelPredicate<T extends string> = (modelName: T) => boolean;

export type ValidModelPredicate<T extends string, ModelEnum extends Record<string | number, T>> = (
  modelName: T
) => modelName is ModelEnum[keyof ModelEnum];

export const generateValidModelPredicate = <
  T extends string,
  ModelEnum extends Record<string | number, T>,
>(
  enumObj: ModelEnum
): ValidModelPredicate<T, ModelEnum> => {
  const modelValues = Object.values(enumObj);
  return ((modelName) => modelValues.includes(modelName)) as ValidModelPredicate<T, ModelEnum>;
};
