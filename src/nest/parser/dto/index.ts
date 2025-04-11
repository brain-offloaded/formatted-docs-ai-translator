import { IpcChannel } from '@/nest/common/ipc.channel';
import { ParseJsonRequestDto } from './request/parse-json-request.dto';
import { ParsePlainTextRequestDto } from './request/parse-plain-text-request.dto';
import { ApplyTranslationToPlainTextRequestDto } from './request/apply-translation-to-plain-text-request.dto';
import { BaseApplyResponseDto } from './response/base-apply-response.dto';
import { BaseParseResponseDto } from './response/base-parse-response.dto';
import { ApplyTranslationToJsonRequestDto } from './request/apply-translation-to-json-request.dto';
import { ParseCsvRequestDto } from './request/parse-csv-request.dto';
import { ApplyTranslationToCsvRequestDto } from './request/apply-translation-to-csv-request.dto';

export class ParserRequestResponse {
  [IpcChannel.ParseJson]: {
    Request: ParseJsonRequestDto;
    Response: BaseParseResponseDto;
  };
  [IpcChannel.ApplyTranslationToJson]: {
    Request: ApplyTranslationToJsonRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ParsePlainText]: {
    Request: ParsePlainTextRequestDto;
    Response: BaseParseResponseDto;
  };
  [IpcChannel.ApplyTranslationToPlainText]: {
    Request: ApplyTranslationToPlainTextRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ParseCsv]: {
    Request: ParseCsvRequestDto;
    Response: BaseParseResponseDto;
  };
  [IpcChannel.ApplyTranslationToCsv]: {
    Request: ApplyTranslationToCsvRequestDto;
    Response: BaseApplyResponseDto;
  };
}
