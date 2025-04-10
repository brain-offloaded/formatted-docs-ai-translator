export const removeTags = (text: string): string => {
  return text.replace(/<\|[0-9]+\|>/g, '');
};

export const trimAndFilterTextArray = (textArray: string[]): string[] => {
  return textArray.map((line) => line.trim()).filter((line) => !!line);
};

export const tagTexts = (texts: string[]): string => {
  return trimAndFilterTextArray(texts)
    .map((text, index) => `<|${index + 1}|>${text}`)
    .join('\n');
};
