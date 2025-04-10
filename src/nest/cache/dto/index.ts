import { IpcChannel } from '@/nest/common/ipc.channel';
import { GetTranslationsResponseDto } from './response/get-translations-response.dto';
import { GetTranslationsRequestDto } from './request/get-translation-request.dto';
import { GetTranslationHistoryResponseDto } from './response/get-translation-history-response.dto';
import { GetTranslationHistoryRequestDto } from './request/get-translation-history-request.dto';
import { UpdateTranslationRequestDto } from './request/update-translation-request.dto';
import { UpdateTranslationResponseDto } from './response/update-translation-response.dto';
import { DeleteTranslationsRequestDto } from './request/delete-translations-request.dto';
import { DeleteTranslationsResponseDto } from './response/delete-translations-response.dto';
import { DeleteAllTranslationsRequestDto } from './request/delete-all-translations-request.dto';
import { DeleteAllTranslationsResponseDto } from './response/delete-all-translations-response.dto';
import { ExportTranslationsResponseDto } from './response/export-translations-response.dto';
import { ExportTranslationsRequestDto } from './request/export-translations-request.dto';
import { ImportTranslationsRequestDto } from './request/import-translations-request.dto';
import { ImportTranslationsResponseDto } from './response/import-translations-response.dto';

export class CacheRequestResponse {
  [IpcChannel.GetTranslations]: {
    Request: GetTranslationsRequestDto;
    Response: GetTranslationsResponseDto;
  };
  [IpcChannel.GetTranslationHistory]: {
    Request: GetTranslationHistoryRequestDto;
    Response: GetTranslationHistoryResponseDto;
  };
  [IpcChannel.UpdateTranslation]: {
    Request: UpdateTranslationRequestDto;
    Response: UpdateTranslationResponseDto;
  };
  [IpcChannel.DeleteTranslations]: {
    Request: DeleteTranslationsRequestDto;
    Response: DeleteTranslationsResponseDto;
  };
  [IpcChannel.DeleteAllTranslations]: {
    Request: DeleteAllTranslationsRequestDto;
    Response: DeleteAllTranslationsResponseDto;
  };
  [IpcChannel.ExportTranslations]: {
    Request: ExportTranslationsRequestDto;
    Response: ExportTranslationsResponseDto;
  };
  [IpcChannel.ImportTranslations]: {
    Request: ImportTranslationsRequestDto;
    Response: ImportTranslationsResponseDto;
  };
}
