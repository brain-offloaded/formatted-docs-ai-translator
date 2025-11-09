import { TranslationInput } from '../../domain/translation-input';
import { arrayBufferToBase64, readFileAsArrayBuffer } from '@/react/utils/fileUtils';

export async function extractImageAsBase64(
  input: TranslationInput
): Promise<{ base64: string; name: string }> {
  const { content } = input;

  if (typeof content === 'string') {
    if (content.startsWith('data:image/')) {
      const parts = content.split(',');
      const base64 = parts[1] ?? '';
      return { base64, name: 'image_from_data_url' };
    }
    // 순수 base64 문자열로 가정
    return { base64: content, name: 'image_from_base64_string' };
  }

  if (content instanceof File) {
    const arrayBuffer = await readFileAsArrayBuffer(content);
    const base64 = arrayBufferToBase64(arrayBuffer);
    return { base64, name: content.name };
  }

  throw new Error('지원하지 않는 입력 타입입니다.');
}
