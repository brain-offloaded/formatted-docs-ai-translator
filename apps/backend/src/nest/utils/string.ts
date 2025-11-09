export const removeTags = (text: string): string => {
  return text.replace(/<\|[0-9]+\|>/g, '');
};

export const trimAndFilterTextArray = (textArray: string[]): string[] => {
  return textArray.map((line) => line.trim()).filter((line) => !!line);
};

export const tagTexts = (
  texts: string[],
  startIndex = 1
): { taggedTexts: string; lastIndex: number; tagCount: number } => {
  const taggedTextArray = trimAndFilterTextArray(texts).map(
    (text, index) => `<|${index + startIndex}|>${text}`
  );
  const taggedTexts = taggedTextArray.join('');

  return {
    taggedTexts,
    lastIndex: taggedTextArray.length + startIndex - 1,
    tagCount: taggedTextArray.length,
  };
};
