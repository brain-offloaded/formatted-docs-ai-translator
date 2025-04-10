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
    try {
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
    } catch (error) {
      this.logger.error('번역 목록을 조회하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.GetTranslationHistory)
  async getTranslationHistory(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.GetTranslationHistory>
  ): Promise<InvokeFunctionResponse<IpcChannel.GetTranslationHistory>> {
    try {
      const translationHistory = await this.cacheManagerService.getTranslationHistoryById(
        request.translationId
      );
      return {
        success: true,
        message: '번역 이력을 조회했습니다.',
        translationHistory,
      };
    } catch (error) {
      this.logger.error('번역 이력을 조회하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.UpdateTranslation)
  async updateTranslation(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.UpdateTranslation>
  ): Promise<InvokeFunctionResponse<IpcChannel.UpdateTranslation>> {
    try {
      await this.cacheManagerService.updateTranslation(request.id, request.target);
      return { success: true, message: '번역이 업데이트되었습니다.' };
    } catch (error) {
      this.logger.error('번역을 업데이트하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.DeleteTranslations)
  async deleteTranslation(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.DeleteTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteTranslations>> {
    try {
      await this.cacheManagerService.deleteTranslations(request.translationIds);
      return { success: true, message: '번역이 삭제되었습니다.' };
    } catch (error) {
      this.logger.error('번역을 삭제하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.DeleteAllTranslations)
  async deleteAllTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.DeleteAllTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.DeleteAllTranslations>> {
    try {
      await this.cacheManagerService.deleteAllTranslations(request.searchParams);
      return { success: true, message: '모든 번역이 삭제되었습니다.' };
    } catch (error) {
      this.logger.error('번역을 삭제하는 중 오류가 발생했습니다:', { error });
      throw error;
    }
  }

  @HandleIpc(IpcChannel.ExportTranslations)
  async exportTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.ExportTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.ExportTranslations>> {
    try {
      const translations = await this.cacheManagerService.exportTranslations(request.searchParams);
      return {
        success: true,
        translations,
        message: '번역 내보내기가 성공적으로 완료되었습니다.',
      };
    } catch (error) {
      this.logger.error('번역 내보내기 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  @HandleIpc(IpcChannel.ImportTranslations)
  async importTranslations(
    event: IpcMainInvokeEvent,
    request: InvokeFunctionRequest<IpcChannel.ImportTranslations>
  ): Promise<InvokeFunctionResponse<IpcChannel.ImportTranslations>> {
    try {
      const updatedCount = await this.cacheManagerService.importTranslations(request.translations);
      return {
        success: true,
        updatedCount,
        message: `${updatedCount}개의 번역이 성공적으로 업데이트되었습니다.`,
      };
    } catch (error) {
      this.logger.error('번역 가져오기 중 오류가 발생했습니다:', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }
}
