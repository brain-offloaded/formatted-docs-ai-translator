import { Injectable } from '@nestjs/common';
import { BrowserWindow, shell, dialog } from 'electron';
import { LoggerService } from '../logger/logger.service';
import { HandleIpc, IpcHandler } from './ipc.handler';
import { IpcChannel } from '@apps/common/dist/ipc/ipc-channel';
import { errorToString } from '@/nest/utils/error-stringify';
import { InvokeFunctionRequest, InvokeFunctionResponse } from '@apps/common/dist/types/electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { OpenAdvancedViewerResponseDto } from '@apps/common/dist/ipc/dto/response/open-advanced-viewer-response.dto';
import { AdvancedViewerLoadZipResponseDto } from '@apps/common/dist/ipc/dto/response/advanced-viewer-load-zip-response.dto';
import { AdvancedViewerLoadZipRequestDto } from '@apps/common/dist/ipc/dto/request/advanced-viewer-load-zip-request.dto';
import { TempWorkspaceService } from '../cache/temp-workspace/temp-workspace.service';

@Injectable()
export class CommonIpcHandler extends IpcHandler {
  constructor(
    protected readonly logger: LoggerService,
    private readonly tempWorkspaceService: TempWorkspaceService
  ) {
    super();
  }

  @HandleIpc(IpcChannel.OpenZipInAdvancedViewerDialog)
  async openZipInAdvancedViewerDialog(): Promise<
    InvokeFunctionResponse<IpcChannel.OpenZipInAdvancedViewerDialog>
  > {
    try {
      // Ensure viewer window exists
      await this.openAdvancedViewer();
      const browser =
        this.advancedViewerWindow || BrowserWindow.getAllWindows().find((w) => !w.isDestroyed());
      if (!browser) throw new Error('열린 창이 없습니다.');

      const result = await dialog.showOpenDialog(browser, {
        properties: ['openFile'],
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      });
      if (result.canceled || !result.filePaths?.[0]) {
        return { success: false, message: '취소됨' };
      }
      const zipPath = result.filePaths[0];
      const req: AdvancedViewerLoadZipRequestDto = { zipPath };
      await this.advancedViewerLoadZip(
        undefined as unknown as Electron.IpcMainInvokeEvent,
        req as unknown as InvokeFunctionRequest<IpcChannel.AdvancedViewerLoadZip>
      );
      return { success: true, message: '열기 성공', selectedPath: zipPath };
    } catch (error) {
      return { success: false, message: errorToString(error) };
    }
  }

  @HandleIpc(IpcChannel.OpenExternalUrl)
  async openExternalUrl(
    event: Electron.IpcMainInvokeEvent,
    { url }: InvokeFunctionRequest<IpcChannel.OpenExternalUrl>
  ): Promise<InvokeFunctionResponse<IpcChannel.OpenExternalUrl>> {
    try {
      await shell.openExternal(url);
      return { success: true, message: '외부 URL 열기 성공' };
    } catch (error) {
      this.logger.error('외부 URL 열기 실패:', { url, error: errorToString(error) });
      return { success: false, message: errorToString(error) };
    }
  }

  @HandleIpc(IpcChannel.ReadTextFile)
  async readTextFile(
    _event: Electron.IpcMainInvokeEvent,
    { path: filePath }: InvokeFunctionRequest<IpcChannel.ReadTextFile>
  ): Promise<InvokeFunctionResponse<IpcChannel.ReadTextFile>> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, content };
    } catch (error) {
      this.logger.error('텍스트 파일 읽기 실패:', {
        filePath,
        error: errorToString(error),
      });
      return { success: false, message: errorToString(error) };
    }
  }

  private advancedViewerWindow: BrowserWindow | null = null;

  @HandleIpc(IpcChannel.OpenAdvancedImageViewer)
  async openAdvancedViewer(): Promise<InvokeFunctionResponse<IpcChannel.OpenAdvancedImageViewer>> {
    try {
      if (this.advancedViewerWindow && !this.advancedViewerWindow.isDestroyed()) {
        this.advancedViewerWindow.focus();
        const res: OpenAdvancedViewerResponseDto = {
          success: true,
          message: '이미 열려있음',
          windowId: this.advancedViewerWindow.id,
        };
        return res;
      }

      this.advancedViewerWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, '../../preload.js'),
          sandbox: true,
          webSecurity: true,
        },
        autoHideMenuBar: true,
        useContentSize: true,
        backgroundColor: '#000000',
        title: 'Advanced Image Viewer',
      });

      this.advancedViewerWindow.maximize();

      // load the same index.html but route by hash for viewer mount
      const indexFile = path.join(__dirname, '../../../index.html');
      await this.advancedViewerWindow.loadFile(indexFile, { hash: 'advanced-viewer' });

      this.advancedViewerWindow.on('closed', () => {
        this.advancedViewerWindow = null;
      });

      const res: OpenAdvancedViewerResponseDto = {
        success: true,
        message: '열림',
        windowId: this.advancedViewerWindow.id,
      };
      return res;
    } catch (error) {
      this.logger.error('고급 이미지 뷰어 창 열기 실패:', { error: errorToString(error) });
      const res: OpenAdvancedViewerResponseDto = { success: false, message: errorToString(error) };
      return res;
    }
  }

  @HandleIpc(IpcChannel.AdvancedViewerLoadZip)
  async advancedViewerLoadZip(
    _event: Electron.IpcMainInvokeEvent,
    {
      zipPath,
      zipBase64,
      zipBuffer,
      name,
      windowId,
    }: InvokeFunctionRequest<IpcChannel.AdvancedViewerLoadZip>
  ): Promise<InvokeFunctionResponse<IpcChannel.AdvancedViewerLoadZip>> {
    this.logger.info('🎯 CommonIpcHandler: advancedViewerLoadZip 시작', {
      zipPath,
      zipBase64,
      zipBuffer,
      name,
      windowId,
    });
    const workspace = await this.tempWorkspaceService.createWorkspace();

    try {
      const target =
        (windowId && BrowserWindow.fromId(windowId)) ||
        this.advancedViewerWindow ||
        BrowserWindow.getAllWindows().find((w) => w.title?.includes('Advanced Image Viewer'));

      if (!target) {
        throw new Error('고급 뷰어 창이 없습니다.');
      }

      let buffer: Buffer | undefined;
      // 1) 경로가 오면 디스크에서 직접 읽기 (최소 IPC 페이로드)
      if (zipPath) {
        buffer = await fs.readFile(zipPath);
        if (!name) name = path.basename(zipPath);
      } else if (zipBuffer) {
        console.log('using zipBuffer');
        // 2) ArrayBuffer/Buffer 직접 전달 (기존 최적화 경로)
        if (zipBuffer instanceof ArrayBuffer) {
          buffer = Buffer.from(zipBuffer);
        } else if (Buffer.isBuffer(zipBuffer)) {
          buffer = zipBuffer;
        }
      } else if (zipBase64) {
        // 3) 레거시 경로
        buffer = Buffer.from(zipBase64, 'base64');
      }

      if (!buffer) {
        throw new Error('ZIP 데이터가 없습니다.');
      }

      const categorizedFiles = await this.tempWorkspaceService.extractZipToWorkspace(
        workspace.id,
        buffer
      );

      target.webContents.send(IpcChannel.AdvancedViewerLoadZip, {
        workspaceId: workspace.id,
        workspacePath: workspace.path,
        categorizedFiles: categorizedFiles,
        name,
      });

      const res: AdvancedViewerLoadZipResponseDto = {
        success: true,
        message: '임시 폴더로 전달됨',
      };
      return res;
    } catch (error) {
      await this.tempWorkspaceService.cleanupWorkspace(workspace.id);
      this.logger.error('고급 뷰어로 ZIP 전달 실패:', { error: errorToString(error) });
      const res: AdvancedViewerLoadZipResponseDto = {
        success: false,
        message: errorToString(error),
      };
      return res;
    }
  }
}
