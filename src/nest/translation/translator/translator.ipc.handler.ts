import { Injectable } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../../types/electron';
import { errorToString } from '../../../utils/error-stringify';
import { IpcHandler, HandleIpc } from '../../common/ipc.handler';
import { IpcChannel } from '../../common/ipc.channel';
import { LoggerService } from '../../logger/logger.service';
import { TranslatorService } from './services/translator.service';

@Injectable()
export class TranslatorIpcHandler extends IpcHandler {
  constructor(
    private readonly translatorService: TranslatorService,
    private readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.TranslateTextArray)
  async translateTextArray(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.TranslateTextArray>
  ): Promise<InvokeFunctionResponse<IpcChannel.TranslateTextArray>> {
    try {
      const response = await this.translatorService.translate(request);
      return {
        success: true,
        message: '번역이 완료되었습니다.',
        translatedTextPaths: response.textPaths,
      };
    } catch (error) {
      this.logger.error('텍스트 배열 번역 중 오류가 발생했습니다:', {
        error: errorToString(error),
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        translatedTextPaths: [],
      };
    }
  }
}
