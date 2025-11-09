export const trimAndFilterTextArray = (textArray: string[]): string[] => {
  return textArray.map((line) => line.trim()).filter((line) => !!line);
};

export type SegmentValueKey = 'text' | 'translated_text';

export const tagTexts = (
  texts: string[],
  startIndex = 1,
  valueKey: SegmentValueKey = 'text'
): { taggedTexts: string; lastIndex: number; tagCount: number } => {
  const trimmedTexts = trimAndFilterTextArray(texts);
  const segments = trimmedTexts.map((text, index) => {
    return {
      id: index + startIndex,
      [valueKey]: text,
    };
  });

  return {
    taggedTexts: JSON.stringify({ segments }),
    lastIndex: segments.length + startIndex - 1,
    tagCount: segments.length,
  };
};
