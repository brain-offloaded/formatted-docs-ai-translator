import { readFile } from 'fs/promises';

import { Injectable } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../types/electron';
import { IpcHandler, HandleIpc } from '../common/ipc.handler';
import { IpcChannel } from '../common/ipc.channel';
import { LoggerService } from '../logger/logger.service';
import { ParserService } from './services/parser.service';
import { deepClone } from '../../utils/deep-clone';

@Injectable()
export class ParserIpcHandler extends IpcHandler {
  constructor(
    private readonly parserService: ParserService,
    protected readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.ParseJsonString)
  async parseJsonString(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseJsonString>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseJsonString>> {
    try {
      const jsonObject = JSON.parse(content);
      const targets = this.parserService.getJsonTranslationTargets(deepClone(jsonObject), options);
      return {
        success: true,
        targets,
        message: 'JSON 파싱 성공',
      };
    } catch (error) {
      this.logger.error('JSON 문자열을 파싱하는 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToJsonString)
  async applyTranslationToJsonString(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToJsonString>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToJsonString>> {
    try {
      const result = this.parserService.applyJsonTranslation(
        JSON.parse(content),
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

  @HandleIpc(IpcChannel.ParseJsonFile)
  async parseJsonFile(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseJsonFile>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseJsonFile>> {
    try {
      const json = await readFile(content, 'utf8');
      const jsonObject = JSON.parse(json);
      const targets = this.parserService.getJsonTranslationTargets(deepClone(jsonObject), options);
      return {
        success: true,
        targets,
        message: 'JSON 파싱 성공',
      };
    } catch (error) {
      this.logger.error('JSON 파일을 파싱하는 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToJsonFile)
  async applyTranslationToJsonFile(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToJsonFile>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToJsonFile>> {
    try {
      const json = await readFile(content, 'utf8');
      const jsonObject = JSON.parse(json);
      const result = this.parserService.applyJsonTranslation(
        jsonObject,
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

  @HandleIpc(IpcChannel.ParsePlainText)
  async parsePlainText(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParsePlainText>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParsePlainText>> {
    try {
      const targets = this.parserService.getPlainTextTranslationTargets(content, options);
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
      const result = this.parserService.applyPlainTextTranslation(
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

  @HandleIpc(IpcChannel.ParseCsvFile)
  async parseCsvFile(
    event: IpcMainInvokeEvent,
    { content, options }: InvokeFunctionRequest<IpcChannel.ParseCsvFile>
  ): Promise<InvokeFunctionResponse<IpcChannel.ParseCsvFile>> {
    try {
      const fileContent = await readFile(content, 'utf8');
      const targets = this.parserService.getCsvTranslationTargets(fileContent, options);
      return {
        success: true,
        targets,
        message: 'CSV 파싱 성공',
      };
    } catch (error) {
      this.logger.error('CSV 파일을 파싱하는 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        targets: [],
      };
    }
  }

  @HandleIpc(IpcChannel.ApplyTranslationToCsvFile)
  async applyTranslationToCsvFile(
    event: IpcMainInvokeEvent,
    {
      content,
      translatedTextPaths,
      options,
    }: InvokeFunctionRequest<IpcChannel.ApplyTranslationToCsvFile>
  ): Promise<InvokeFunctionResponse<IpcChannel.ApplyTranslationToCsvFile>> {
    try {
      const fileContent = await readFile(content, 'utf8');
      const result = this.parserService.applyCsvTranslation(
        fileContent,
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
}
