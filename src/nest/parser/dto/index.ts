import { IpcChannel } from '@/nest/common/ipc.channel';
import { ParseJsonRequestDto } from './request/parse-json-request.dto';
import { ParsePlainTextRequestDto } from './request/parse-plain-text-request.dto';
import { ApplyTranslationToPlainTextRequestDto } from './request/apply-translation-to-plain-text-request.dto';
import { BaseApplyResponseDto } from './response/base-apply-response.dto';
import { ApplyTranslationToJsonRequestDto } from './request/apply-translation-to-json-request.dto';
import { ParseCsvRequestDto } from './request/parse-csv-request.dto';
import { ApplyTranslationToCsvRequestDto } from './request/apply-translation-to-csv-request.dto';
import { ParseJsonResponseDto } from './response/parse-json-response.dto';
import { ParsePlainTextResponseDto } from './response/parse-plain-text-response.dto';
import { ParseCsvResponseDto } from './response/parse-csv-response.dto';

export class ParserRequestResponse {
  [IpcChannel.ParseJson]: {
    Request: ParseJsonRequestDto;
    Response: ParseJsonResponseDto;
  };
  [IpcChannel.ApplyTranslationToJson]: {
    Request: ApplyTranslationToJsonRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ParsePlainText]: {
    Request: ParsePlainTextRequestDto;
    Response: ParsePlainTextResponseDto;
  };
  [IpcChannel.ApplyTranslationToPlainText]: {
    Request: ApplyTranslationToPlainTextRequestDto;
    Response: BaseApplyResponseDto;
  };
  [IpcChannel.ParseCsv]: {
    Request: ParseCsvRequestDto;
    Response: ParseCsvResponseDto;
  };
  [IpcChannel.ApplyTranslationToCsv]: {
    Request: ApplyTranslationToCsvRequestDto;
    Response: BaseApplyResponseDto;
  };
}
