import { Injectable } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../types/electron';
import { IpcHandler, HandleIpc } from '../common/ipc.handler';
import { IpcChannel } from '../common/ipc.channel';
import { LoggerService } from '../logger/logger.service';
import { ParserService } from './services/parser.service';

@Injectable()
export class ParserIpcHandler extends IpcHandler {
  constructor(
    private readonly parserService: ParserService,
    protected readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.ParseJson)
  async parseJson(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseJson>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseJson>> {
    try {
      const targets = await this.parserService.getJsonTranslationTargets(content, options);
      return {
        success: true,
        targets,
        message: 'JSON 파싱 성공',
      };
    } catch (error) {
      this.logger.error('JSON을 파싱하는 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToJson)
  async applyTranslationToJson(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToJson>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToJson>> {
    try {
      const result = await this.parserService.applyJsonTranslation(
        content,
        translatedTextPaths,
        options
      );
      return {
        success: true,
        result: JSON.stringify(result),
        message: 'JSON 번역 적용 성공',
      };
    } catch (error) {
      this.logger.error('JSON 번역 적용 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        result: '',
      };
    }
  }

  @HandleIpc(IpcChannel.ParseCsv)
  async parseCsv(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseCsv>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseCsv>> {
    try {
      const targets = await this.parserService.getCsvTranslationTargets(content, options);
      return {
        success: true,
        targets,
        message: 'CSV 파싱 성공',
      };
    } catch (error) {
      this.logger.error('CSV 파싱 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToCsv)
  async applyTranslationToCsv(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToCsv>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToCsv>> {
    try {
      const result = await this.parserService.applyCsvTranslation(
        content,
        translatedTextPaths,
        options
      );
      return {
        success: true,
        result,
        message: 'CSV 번역 적용 성공',
      };
    } catch (error) {
      this.logger.error('CSV 번역 적용 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        result: '',
      };
    }
  }

  @HandleIpc(IpcChannel.ParsePlainText)
  async parsePlainText(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParsePlainText>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParsePlainText>> {
    try {
      const targets = await this.parserService.getPlainTextTranslationTargets(content, options);
      return {
        success: true,
        targets,
        message: '텍스트 파싱 성공',
      };
    } catch (error) {
      this.logger.error('텍스트 파싱 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToPlainText)
  async applyTranslationToPlainText(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToPlainText>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToPlainText>> {
    try {
      const result = await this.parserService.applyPlainTextTranslation(
        content,
        translatedTextPaths,
        options
      );
      return {
        success: true,
        result,
        message: '텍스트 번역 적용 성공',
      };
    } catch (error) {
      this.logger.error('텍스트 번역 적용 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        result: '',
      };
    }
  }

  @HandleIpc(IpcChannel.ParseSubtitle)
  async parseSubtitle(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseSubtitle>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseSubtitle>> {
    try {
      const targets = await this.parserService.getSubtitleTranslationTargets(content, options);
      return {
        success: true,
        targets,
        message: '자막 파싱 성공',
      };
    } catch (error) {
      this.logger.error('자막 파싱 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToSubtitle)
  async applyTranslationToSubtitle(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToSubtitle>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToSubtitle>> {
    try {
      const result = await this.parserService.applySubtitleTranslation(
        content,
        translatedTextPaths,
        options
      );
      return {
        success: true,
        result,
        message: '자막 번역 적용 성공',
      };
    } catch (error) {
      this.logger.error('자막 번역 적용 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        result: '',
      };
    }
  }
}
