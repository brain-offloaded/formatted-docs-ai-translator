export const removeTags = (text: string): string => {
  return text.replace(/<seg id="\d+?">(.*?)<\/seg>/g, '$1');
};

export const trimAndFilterTextArray = (textArray: string[]): string[] => {
  return textArray.map((line) => line.trim()).filter((line) => !!line);
};

export const tagTexts = (
  texts: string[],
  startIndex = 1
): { taggedTexts: string; lastIndex: number; tagCount: number } => {
  const taggedTextArray = trimAndFilterTextArray(texts).map(
    (text, index) => `<seg id="${index + startIndex}">${text}</seg>`
  );
  const taggedTexts = taggedTextArray.join('\n');

  return {
    taggedTexts,
    lastIndex: taggedTextArray.length + startIndex - 1,
    tagCount: taggedTextArray.length,
  };
};
