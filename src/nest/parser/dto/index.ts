import { IpcChannel } from '@/nest/common/ipc.channel';
import { ParseJsonFileRequestDto } from './request/parse-json-file-request.dto';
import { ParseJsonStringRequestDto } from './request/parse-json-string-request.dto';
import { ParsePlainTextRequestDto } from './request/parse-plain-text-request.dto';
import { ApplyTranslationToJsonStringRequestDto } from './request/apply-translation-to-json-string-request.dto';
import { ApplyTranslationToPlainTextRequestDto } from './request/apply-translation-to-plain-text-request.dto';
import { BaseApplyResponseDto } from './response/base-apply-response.dto';
import { BaseParseResponseDto } from './response/base-parse-response.dto';
import { ApplyTranslationToJsonFileRequestDto } from './request/apply-translation-to-json-file-request.dto';

export class ParserRequestResponse {
  [IpcChannel.ParseJsonFile]: {
    Request: ParseJsonFileRequestDto;
    Response: BaseParseResponseDto;
  };
  [IpcChannel.ParseJsonString]: {
    Request: ParseJsonStringRequestDto;
    Response: BaseParseResponseDto;
  };
  [IpcChannel.ParsePlainText]: {
    Request: ParsePlainTextRequestDto;
    Response: BaseParseResponseDto;
  };
  [IpcChannel.ApplyTranslationToJsonString]: {
    Request: ApplyTranslationToJsonStringRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ApplyTranslationToPlainText]: {
    Request: ApplyTranslationToPlainTextRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ApplyTranslationToJsonFile]: {
    Request: ApplyTranslationToJsonFileRequestDto;
    Response: BaseApplyResponseDto;
  };
}
