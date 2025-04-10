import { IpcChannel } from '@/nest/common/ipc.channel';
import { ParseJsonFileRequestDto } from './request/parse-json-file-request.dto';
import { ParseJsonStringRequestDto } from './request/parse-json-string-request.dto';
import { ParsePlainTextRequestDto } from './request/parse-plain-text-request.dto';
import { ApplyTranslationToJsonRequestDto } from './request/apply-translation-to-json-request.dto';
import { ApplyTranslationToPlainTextRequestDto } from './request/apply-translation-to-plain-text-request.dto';
import { BaseApplyResponseDto } from './response/base-apply-response.dto';
import { BaseParseResponseDto } from './response/base-parse-response.dto';

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
  [IpcChannel.ApplyTranslationToJson]: {
    Request: ApplyTranslationToJsonRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ApplyTranslationToPlainText]: {
    Request: ApplyTranslationToPlainTextRequestDto;
    Response: BaseApplyResponseDto;
  };
}
