// Normalize all CRLF/CR to LF to ensure consistent line splitting & key generation
export function normalizeLineEndings(content: string): string {
  if (content.indexOf('\r') === -1) return content; // fast path
  return content.replace(/\r\n?/g, '\n');
}
