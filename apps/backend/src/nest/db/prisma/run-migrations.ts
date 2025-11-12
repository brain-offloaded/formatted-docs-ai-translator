import path from 'path';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { fork } from 'child_process';

// ─────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────
const MIGRATION_LOCK_FILE = '.migration.lock';
const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5분
const SQLITE_FILE_PREFIX = 'file:';

// ─────────────────────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────────────────────
function acquireMigrationLock(lockPath: string): boolean {
  try {
    if (existsSync(lockPath)) {
      const [, ts] = readFileSync(lockPath, 'utf8').split(':');
      const lockTime = parseInt(ts, 10);
      if (Date.now() - lockTime <= STALE_LOCK_TIMEOUT_MS) {
        console.info('[Migration] 이미 실행 중 혹은 직전 완료. 건너뜀.');
        return false;
      }
      console.warn('[Migration] stale 락 발견 → 제거.');
      unlinkSync(lockPath);
    }
    writeFileSync(lockPath, `${process.pid}:${Date.now()}`, 'utf8');
    return true;
  } catch (e) {
    console.error('[Migration] 락 생성 실패:', e);
    return false;
  }
}

function releaseMigrationLock(lockPath: string) {
  try {
    if (existsSync(lockPath)) unlinkSync(lockPath);
  } catch (e) {
    console.warn('[Migration] 락 해제 실패:', e);
  }
}

function prismaCliUnpacked(resourcesPath: string) {
  // 프로덕션 패키지에서만 사용. unpacked된 CLI를 직접 실행.
  const p = path.join(
    resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    'prisma',
    'build',
    'index.js'
  );
  if (!existsSync(p)) {
    throw new Error(
      `[Migration] unpacked Prisma CLI가 없음: ${p}\n` +
        'package.json의 "asarUnpack"에 "node_modules/prisma/build/**"가 포함되어야 합니다.'
    );
  }
  return p;
}

// ─────────────────────────────────────────────────────────────
// 메인 함수
// ─────────────────────────────────────────────────────────────
/**
 * 프로덕션(Electron 패키지)에서만 호출되는 마이그레이션 실행기.
 * @param databaseUrl SQLite "file:..." URL
 */
export async function runPrismaMigrations(databaseUrl: string): Promise<void> {
  console.log('[Migration] Prisma 마이그레이션 시작…');

  // 1) 락 경로 계산 & 획득
  const dbPath = databaseUrl.replace(SQLITE_FILE_PREFIX, '');
  const lockPath = path.join(path.dirname(dbPath), MIGRATION_LOCK_FILE);
  if (!acquireMigrationLock(lockPath)) return;

  try {
    // 2) 리소스/경로 확정
    const resources = process.resourcesPath; // .../YourApp/resources
    const schemaPath = path.join(resources, 'prisma', 'schema.prisma');
    const migrationsDir = path.join(resources, 'prisma', 'migrations');

    // 필수 파일 확인
    if (!existsSync(schemaPath) || !existsSync(migrationsDir)) {
      console.warn('[Migration] schema 또는 migrations 디렉터리 없음 → 건너뜀.');
      return;
    }

    // 3) unpacked Prisma CLI 경로
    const cli = prismaCliUnpacked(resources);

    // 4) 포크 실행 (Prisma 자체 로직으로 플랫폼 엔진 선택)
    await new Promise<void>((resolve, reject) => {
      const args = ['migrate', 'deploy', '--schema', schemaPath];

      const child = fork(cli, args, {
        stdio: 'inherit',
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1', // Electron 자식 프로세스를 순수 Node처럼
          DATABASE_URL: databaseUrl,
        },
      });

      child.on('exit', (code) => {
        if (code === 0) {
          console.info('[Migration] 마이그레이션 적용 완료.');
          resolve();
        } else {
          reject(new Error(`[Migration] 프로세스 종료 코드: ${code}`));
        }
      });

      child.on('error', (err) => reject(err));
    });
  } catch (e) {
    console.error('[Migration] 실패:', e);
    // 실패 땐 앱을 계속 띄우지 않도록 필요 시 throw 하거나 프로세스 종료 결정
    // throw e;
  } finally {
    // 5) 락 해제
    console.log('[Migration] 락 해제.');
    releaseMigrationLock(lockPath);
  }
}
