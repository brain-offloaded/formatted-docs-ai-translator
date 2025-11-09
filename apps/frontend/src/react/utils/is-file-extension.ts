const isWildcard = (fileExtension: string) => {
  return fileExtension === '*' || fileExtension === 'all';
};

const normalizeExtension = (fileExtension: string) => {
  const trimmedExtension = fileExtension.trim();
  if (trimmedExtension.startsWith('.')) return trimmedExtension;
  if (trimmedExtension.startsWith('*.')) return trimmedExtension.slice(1);
  return `*.${trimmedExtension}`;
};

export const isFileExtension = (file: File, fileExtension: string) => {
  if (isWildcard(fileExtension)) return true;
  const extensions = fileExtension.split(',').map((ext) => normalizeExtension(ext));
  return extensions.some((ext) => file.name.endsWith(ext) || isWildcard(ext));
};
