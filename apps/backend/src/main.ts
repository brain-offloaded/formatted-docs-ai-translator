import 'reflect-metadata';
import './env';

import * as path from 'path';

import { app, BrowserWindow, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { bootstrapNestJs } from './nest/bootstrap';
import { errorToString } from '@/nest/utils/error-stringify';
import { logger } from '@/nest/utils/logger';
import { LoggerService } from './nest/logger/logger.service';

// NestJS 애플리케이션 인스턴스
let nestApp: NestFastifyApplication;

// 개발 환경에서만 hot reload 적용
// if (process.env.NODE_ENV === 'development') {
//   // eslint-disable-next-line @typescript-eslint/no-require-imports
//   require('electron-reloader')(module, {
//     debug: true,
//     watchRenderer: true,
//   });
// }

// 전역 Promise rejection 핸들러 설정
process.on('unhandledRejection', (reason, promise) => {
  logger.error('처리되지 않은 Promise rejection이 발생했습니다:', { reason, promise });
  // 추가 오류 로깅
  if (reason instanceof Error) {
    logger.error('오류 상세:', {
      message: reason.message,
      stack: reason.stack,
      name: reason.name,
    });
  }
});

// 전역 Exception 핸들러 설정
process.on('uncaughtException', (error) => {
  logger.error('처리되지 않은 예외가 발생했습니다:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  // 치명적인 오류 발생 시 사용자에게 알림
  if (mainWindow) {
    dialog.showErrorBox(
      '오류가 발생했습니다',
      '애플리케이션에서 예기치 않은 오류가 발생했습니다. 애플리케이션을 다시 시작해주세요.'
    );
  }
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // 추가 보안 설정
      sandbox: true,
      webSecurity: true,
    },
    autoHideMenuBar: true,
    useContentSize: true,
  });

  // 창을 최대화 상태로 시작
  mainWindow.maximize();

  // 한글 IME 입력 문제 해결
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Process' && input.type === 'keyDown') {
      event.preventDefault();
    }
  });

  // 렌더러 프로세스 크래시 처리
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    logger.error('렌더러 프로세스가 종료되었습니다:', { details });

    // 렌더러 프로세스 크래시 시 사용자에게 알림
    if (details.reason !== 'clean-exit') {
      dialog.showErrorBox(
        '애플리케이션 오류',
        '렌더러 프로세스에 문제가 발생했습니다. 애플리케이션을 다시 시작해주세요.'
      );
    }
  });

  // 웹 컨텐츠에서 에러 발생 시 처리
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logger.error('페이지 로드 실패:', { errorCode, errorDescription });
  });

  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(async () => {
  try {
    // 캐시 매니저 초기화

    // NestJS 부트스트랩
    nestApp = await bootstrapNestJs();
    const nestLogger = nestApp.get(LoggerService);
    nestLogger.info('NestJS가 메인 프로세스에서 시작되었습니다.');

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    // 개발 환경이 아닌 경우 업데이트 확인
    if (process.env.NODE_ENV !== 'development') {
      // ZIP으로 배포하므로 자동 다운로드는 비활성화
      autoUpdater.autoDownload = false;

      autoUpdater.on('update-available', (info) => {
        nestLogger.info('새로운 업데이트를 발견했습니다:', { info });
        dialog
          .showMessageBox({
            type: 'info',
            title: '업데이트 알림',
            message: `새로운 버전(v${info.version})이 출시되었습니다.`,
            detail: `현재 버전은 v${app.getVersion()}입니다. 다운로드 페이지로 이동하시겠습니까?`,
            buttons: ['예', '아니오'],
            defaultId: 0,
          })
          .then(({ response }) => {
            if (response === 0) {
              // 사용자가 '예'를 클릭하면 GitHub 릴리스 페이지로 이동
              shell.openExternal(
                'https://github.com/brain-offloaded/formatted-docs-ai-translator/releases/latest'
              );
            }
          });
      });

      autoUpdater.on('update-not-available', (info) => {
        nestLogger.info('현재 최신 버전을 사용 중입니다:', { info });
      });

      autoUpdater.on('error', (err) => {
        nestLogger.error('업데이트 확인 중 오류가 발생했습니다:', { error: err });
      });

      // 앱 시작 후 3초 뒤에 업데이트 확인
      setTimeout(() => {
        autoUpdater
          .checkForUpdates()
          .then((data) => {
            nestLogger.info('업데이트 확인이 완료되었습니다.', { data });
          })
          .catch((err) => {
            nestLogger.error('업데이트 확인 실행 중 오류 발생:', err);
          });
      }, 3000);
    }
  } catch (error) {
    logger.error('애플리케이션 초기화 중 오류 발생:', { error: errorToString(error) });
    // 초기화 실패 시 사용자에게 알림 후 애플리케이션 종료
    dialog.showErrorBox(
      '시작 오류',
      '애플리케이션을 초기화하는 중 오류가 발생했습니다. 애플리케이션을 종료합니다.'
    );
    app.exit(1);
  }
});

app.on('window-all-closed', async () => {
  // NestJS 애플리케이션 종료
  if (nestApp) {
    await nestApp.close();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
