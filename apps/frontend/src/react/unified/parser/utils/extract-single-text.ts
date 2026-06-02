// Utility to normalize TranslationInput.content (string | File) to a single text string
// - Returns '' for empty content
// - Throws if unsupported type
import { TranslationInput } from '../../domain/translation-input';
import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { safeIpcInvoke } from '@/react/ipc/safeInvoke';
import { getElectronFilePath, readFileAsText } from '@/react/utils/fileUtils';

export async function extractSingleText(input: TranslationInput): Promise<string> {
  if (typeof input.content === 'string') return input.content.trim();
  if (input.content instanceof File) {
    const filePath = getElectronFilePath(input.content);
    if (filePath) {
      const { data } = await safeIpcInvoke(IpcChannel.ReadTextFile, { path: filePath });
      if (data?.success && typeof data.content === 'string') {
        return data.content.trim();
      }
    }

    const text = await readFileAsText(input.content);
    return text.trim();
  }
  throw new Error('지원하지 않는 입력 타입입니다.');
}
