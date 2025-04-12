import 'reflect-metadata';
import './env';

import * as path from 'path';

import { INestApplicationContext } from '@nestjs/common';
import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

import { bootstrapNestJs } from './nest/bootstrap';
import { errorToString } from './utils/error-stringify';
import { logger } from './utils/logger';
import { LoggerService } from './nest/logger/logger.service';

// NestJS 애플리케이션 인스턴스
let nestApp: INestApplicationContext;

// 개발 환경에서만 hot reload 적용
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('electron-reloader')(module, {
    debug: true,
    watchRenderer: true,
  });
}

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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

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

    // 개발 환경이 아닌 경우 자동 업데이트 확인 시작
    if (process.env.NODE_ENV !== 'development') {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          nestLogger.error('자동 업데이트 확인 중 오류 발생:', err);
        });
      }, 3000); // 3초 후 업데이트 확인 (앱이 완전히 로드된 후)
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
