export const trimAndFilterTextArray = (textArray: string[]): string[] => {
  return textArray.map((line) => line.trim()).filter((line) => !!line);
};

export type SegmentValueKey = 'text';

export const tagTexts = (
  texts: string[],
  startIndex = 1,
  valueKey: SegmentValueKey = 'text'
): {
  taggedTexts: string;
  lastIndex: number;
  tagCount: number;
  segments: Array<{ id: number } & Record<SegmentValueKey, string>>;
  originalTexts: string[];
} => {
  const segments: Array<{ id: number } & Record<SegmentValueKey, string>> = [];
  const originalTexts: string[] = [];
  const trimmedTexts = texts.map((line) => line.trim());

  trimmedTexts.forEach((trimmed, index) => {
    if (!trimmed) return;
    segments.push({
      id: segments.length + startIndex,
      [valueKey]: trimmed,
    } as { id: number } & Record<SegmentValueKey, string>);
    originalTexts.push(texts[index]);
  });

  return {
    taggedTexts: JSON.stringify({ segments }),
    lastIndex: segments.length + startIndex - 1,
    tagCount: segments.length,
    segments,
    originalTexts,
  };
};
