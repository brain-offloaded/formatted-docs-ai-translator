import { IpcChannel } from '@/nest/common/ipc.channel';
import { TranslateTextArrayRequestDto } from './request/translate-text-array-request.dto';
import { TranslateTextArrayResponseDto } from './response/translate-text-array-response.dto';

export class TranslatorRequestResponse {
  [IpcChannel.TranslateTextArray]: {
    Request: TranslateTextArrayRequestDto;
    Response: TranslateTextArrayResponseDto;
  };
}
