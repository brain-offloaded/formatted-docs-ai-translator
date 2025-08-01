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
    const targets = await this.parserService.getTranslationTargets('json', content, options);
    return {
      success: true,
      targets,
      message: 'JSON 파싱 성공',
    };
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
    const result = await this.parserService.applyTranslation(
      'json',
      content,
      translatedTextPaths,
      options
    );
    return {
      success: true,
      result: JSON.stringify(result),
      message: 'JSON 번역 적용 성공',
    };
  }

  @HandleIpc(IpcChannel.ParseCsv)
  async parseCsv(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseCsv>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseCsv>> {
    const targets = await this.parserService.getTranslationTargets('csv', content, options);
    return {
      success: true,
      targets,
      message: 'CSV 파싱 성공',
    };
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
    const result = (await this.parserService.applyTranslation(
      'csv',
      content,
      translatedTextPaths,
      options
    )) as string;
    return {
      success: true,
      result,
      message: 'CSV 번역 적용 성공',
    };
  }

  @HandleIpc(IpcChannel.ParsePlainText)
  async parsePlainText(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParsePlainText>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParsePlainText>> {
    const targets = await this.parserService.getTranslationTargets('txt', content, options);
    return {
      success: true,
      targets,
      message: '텍스트 파싱 성공',
    };
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
    const result = (await this.parserService.applyTranslation(
      'txt',
      content,
      translatedTextPaths,
      options
    )) as string;
    return {
      success: true,
      result,
      message: '텍스트 번역 적용 성공',
    };
  }

  @HandleIpc(IpcChannel.ParseSubtitle)
  async parseSubtitle(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseSubtitle>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseSubtitle>> {
    const targets = await this.parserService.getTranslationTargets('subtitle', content, options);
    return {
      success: true,
      targets,
      message: '자막 파싱 성공',
    };
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
    const result = (await this.parserService.applyTranslation(
      'subtitle',
      content,
      translatedTextPaths,
      options
    )) as string;
    return {
      success: true,
      result,
      message: '자막 번역 적용 성공',
    };
  }
}
