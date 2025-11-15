import 'reflect-metadata';
import './env';

import * as path from 'path';
import * as https from 'https';

import { app, BrowserWindow, dialog, shell } from 'electron';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import semver from 'semver';

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

const GITHUB_REPO_OWNER = process.env.UPDATE_REPO_OWNER ?? 'brain-offloaded';
const GITHUB_REPO_NAME = process.env.UPDATE_REPO_NAME ?? 'formatted-docs-ai-translator';
const GITHUB_RELEASE_PAGE_URL = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;
const GITHUB_RELEASE_LATEST_API = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`;

let mainWindow: BrowserWindow | null = null;

type LatestReleaseInfo = {
  version: string;
  htmlUrl: string;
};

function requestLatestRelease(nestLogger: LoggerService): Promise<LatestReleaseInfo | null> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {
      'User-Agent': 'formatted-docs-ai-translator',
      Accept: 'application/vnd.github+json',
    };

    const request = https.request(
      GITHUB_RELEASE_LATEST_API,
      {
        method: 'GET',
        headers,
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const chunks: Buffer[] = [];

        response.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          if (statusCode !== 200) {
            nestLogger.warn('GitHub 최신 릴리스 조회에 실패했습니다.', {
              statusCode,
              statusMessage: response.statusMessage,
            });
            resolve(null);
            return;
          }

          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
            const tagName = typeof payload.tag_name === 'string' ? payload.tag_name : '';
            const latestVersion = semver.clean(tagName);

            if (!latestVersion) {
              nestLogger.warn('릴리스 태그에서 버전 정보를 찾을 수 없습니다.', { tagName });
              resolve(null);
              return;
            }

            const htmlUrl =
              typeof payload.html_url === 'string' ? payload.html_url : GITHUB_RELEASE_PAGE_URL;

            resolve({
              version: latestVersion,
              htmlUrl,
            });
          } catch (error) {
            nestLogger.error('GitHub 릴리스 응답 파싱 중 오류가 발생했습니다.', { error });
            resolve(null);
          }
        });
      }
    );

    request.on('error', (error) => {
      nestLogger.error('GitHub 최신 릴리스 요청 중 오류가 발생했습니다.', { error });
      resolve(null);
    });

    request.end();
  });
}

async function checkLatestRelease(nestLogger: LoggerService) {
  const latestRelease = await requestLatestRelease(nestLogger);

  if (!latestRelease) {
    return;
  }

  const currentVersion = app.getVersion();

  if (semver.gt(latestRelease.version, currentVersion)) {
    nestLogger.info('새로운 릴리스를 감지했습니다.', {
      currentVersion,
      latest: latestRelease.version,
    });

    dialog
      .showMessageBox({
        type: 'info',
        title: '업데이트 알림',
        message: `새로운 버전(v${latestRelease.version})이 출시되었습니다.`,
        detail: `현재 버전은 v${currentVersion}입니다. 다운로드 페이지로 이동하시겠습니까?`,
        buttons: ['예', '아니오'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          shell.openExternal(latestRelease.htmlUrl);
        }
      });
  } else {
    nestLogger.info('현재 최신 버전을 사용 중입니다.', {
      currentVersion,
      latest: latestRelease.version,
    });
  }
}

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

    // 개발 환경이 아닌 경우 수동 업데이트 확인
    if (process.env.NODE_ENV !== 'development') {
      setTimeout(() => {
        void checkLatestRelease(nestLogger);
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
