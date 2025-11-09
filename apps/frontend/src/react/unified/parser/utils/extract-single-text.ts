// Utility to normalize TranslationInput.content (string | File) to a single text string
// - Returns '' for empty content
// - Throws if unsupported type
import { TranslationInput } from '../../domain/translation-input';

export async function extractSingleText(input: TranslationInput): Promise<string> {
  if (typeof input.content === 'string') return input.content.trim();
  if (input.content instanceof File) {
    const text = await input.content.text();
    return text.trim();
  }
  throw new Error('지원하지 않는 입력 타입입니다.');
}
