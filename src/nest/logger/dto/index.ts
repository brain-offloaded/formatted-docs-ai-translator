import { IpcChannel } from '@/nest/common/ipc.channel';
import { GetLogsResponseDto } from './response/get-logs-response.dto';
import { DeleteLogsResponseDto } from './response/delete-logs-response.dto';
import { DeleteAllLogsResponseDto } from './response/delete-all-logs-response.dto';
import { GetLogsRequestDto } from './request/get-logs-request.dto';
import { DeleteLogsRequestDto } from './request/delete-logs-request.dto';
import { DeleteAllLogsRequestDto } from './request/delete-all-logs-request.dto';

export class LoggerRequestResponse {
  [IpcChannel.GetLogs]: {
    Request: GetLogsRequestDto;
    Response: GetLogsResponseDto;
  };
  [IpcChannel.DeleteLogs]: {
    Request: DeleteLogsRequestDto;
    Response: DeleteLogsResponseDto;
  };
  [IpcChannel.DeleteAllLogs]: {
    Request: DeleteAllLogsRequestDto;
    Response: DeleteAllLogsResponseDto;
  };
}
