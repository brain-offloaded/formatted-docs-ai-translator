import { Injectable, Inject } from '@nestjs/common';
import { IpcMainInvokeEvent } from 'electron';

import { InvokeFunctionRequest, InvokeFunctionResponse } from '../../types/electron';
import { IpcHandler, HandleIpc } from '../common/ipc.handler';
import { LoggerService } from '../logger/logger.service';
import { ICacheManagerService } from './cache-manager/services/i-cache-manager-service';
import { IpcChannel } from '../common/ipc.channel';

@Injectable()
export class CacheIpcHandler extends IpcHandler {
  constructor(
    @Inject(ICacheManagerService) private readonly cacheManagerService: ICacheManagerService,
    protected readonly logger: LoggerService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.GetTranslations)
  async getTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.GetTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.GetTranslations>> {
    const translations = await this.cacheManagerService.getTranslationsByConditions(
      request.page,
      request.itemsPerPage,
      request.searchParams
    );
    return {
      translations: translations.translations,
      totalItems: translations.totalItems,
      success: true,
      message: '번역 목록 조회 성공',
    };
  }

  @HandleIpc(IpcChannel.GetTranslationHistory)
  async getTranslationHistory(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.GetTranslationHistory>
  ): Promise<InvokeFunctionResponse<IpcChannel.GetTranslationHistory>> {
    const translationHistory = await this.cacheManagerService.getTranslationHistoryById(
      request.translationId
    );
    return {
      success: true,
      message: '번역 이력을 조회했습니다.',
      translationHistory,
    };
  }

  @HandleIpc(IpcChannel.UpdateTranslation)
  async updateTranslation(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.UpdateTranslation>
  ): Promise<InvokeFunctionResponse<IpcChannel.UpdateTranslation>> {
    await this.cacheManagerService.updateTranslation(request.id, request.target);
    return { success: true, message: '번역이 업데이트되었습니다.' };
  }

  @HandleIpc(IpcChannel.DeleteTranslations)
  async deleteTranslation(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.DeleteTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteTranslations>> {
    await this.cacheManagerService.deleteTranslations(request.translationIds);
    return { success: true, message: '번역이 삭제되었습니다.' };
  }

  @HandleIpc(IpcChannel.DeleteAllTranslations)
  async deleteAllTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.DeleteAllTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteAllTranslations>> {
    await this.cacheManagerService.deleteAllTranslations(request.searchParams);
    return { success: true, message: '모든 번역이 삭제되었습니다.' };
  }

  @HandleIpc(IpcChannel.ExportTranslations)
  async exportTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.ExportTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.ExportTranslations>> {
    const translations = await this.cacheManagerService.exportTranslations(request.searchParams);
    return {
      success: true,
      translations,
      message: '번역 내보내기가 성공적으로 완료되었습니다.',
    };
  }

  @HandleIpc(IpcChannel.ImportTranslations)
  async importTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.ImportTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.ImportTranslations>> {
    const updatedCount = await this.cacheManagerService.importTranslations(request.translations);
    return {
      success: true,
      updatedCount,
      message: `${updatedCount}개의 번역이 성공적으로 업데이트되었습니다.`,
    };
  }
}
