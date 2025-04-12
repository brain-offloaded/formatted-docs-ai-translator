import { IpcChannel } from '../ipc.channel';
import { OpenExternalUrlRequestDto } from './request/open-external-url-request.dto';
import { OpenExternalUrlResponseDto } from './response/open-external-url-response.dto';

export class CommonRequestResponse {
  [IpcChannel.OpenExternalUrl]: {
    Request: OpenExternalUrlRequestDto;
    Response: OpenExternalUrlResponseDto;
  };
}
