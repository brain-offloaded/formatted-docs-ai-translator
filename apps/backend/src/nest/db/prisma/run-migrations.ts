// run-migrations.ts  (프로덕션 전용)

import path from 'path';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { fork } from 'child_process';

const MIGRATION_LOCK_FILE = '.migration.lock';
const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5분
const SQLITE_FILE_PREFIX = 'file:';

function acquireMigrationLock(lockPath: string): boolean {
  try {
    if (existsSync(lockPath)) {
      const [, ts] = readFileSync(lockPath, 'utf8').split(':');
      if (Date.now() - parseInt(ts, 10) <= STALE_LOCK_TIMEOUT_MS) {
        console.info('[Migration] 이미 실행 중/방금 완료. 건너뜀.');
        return false;
      }
      console.warn('[Migration] stale 락 발견 → 제거');
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
  } catch {}
}

// ── 엔진 경로 해석(언팩된 바이너리/라이브러리만 타겟) ─────────────────────────
function firstExisting(paths: string[]) {
  return paths.find((p) => p && existsSync(p));
}
function resolvePrismaEngines(resources: string) {
  const unpackedRoot = path.join(resources, 'app.asar.unpacked', 'node_modules', '@prisma');
  const enginesDir = path.join(unpackedRoot, 'engines');
  const runtimeDir = path.join(unpackedRoot, 'client', 'runtime');

  if (!existsSync(enginesDir) || !existsSync(runtimeDir)) {
    throw new Error('[Migration] 언팩된 Prisma engines/runtime 경로가 없습니다.');
  }

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  // Prisma v6 이름 변화까지 포괄
  const queryCandidates = [
    // Windows
    path.join(runtimeDir, 'query_engine-windows.dll.node'),
    path.join(runtimeDir, 'libquery_engine-windows.dll.node'),
    path.join(enginesDir, 'query_engine-windows.dll.node'),
    path.join(enginesDir, 'libquery_engine-windows.dll.node'),
    // macOS
    path.join(runtimeDir, 'libquery_engine-darwin.dylib.node'),
    path.join(runtimeDir, 'libquery_engine-darwin-arm64.dylib.node'),
    path.join(enginesDir, 'libquery_engine-darwin.dylib.node'),
    path.join(enginesDir, 'libquery_engine-darwin-arm64.dylib.node'),
    // Linux (glibc/musl, OpenSSL 3.x)
    path.join(runtimeDir, 'libquery_engine-debian-openssl-3.0.x.so.node'),
    path.join(runtimeDir, 'libquery_engine-linux-musl-openssl-3.0.x.so.node'),
    path.join(enginesDir, 'libquery_engine-debian-openssl-3.0.x.so.node'),
    path.join(enginesDir, 'libquery_engine-linux-musl-openssl-3.0.x.so.node'),
  ];
  const queryLib = firstExisting(queryCandidates);
  if (!queryLib) throw new Error('[Migration] query engine(.node) 파일을 찾지 못했습니다.');

  const schemaEngine = firstExisting([
    path.join(
      enginesDir,
      isWin ? 'schema-engine-windows.exe' : isMac ? 'schema-engine-darwin' : 'schema-engine'
    ),
  ]);
  const migrationEngine = firstExisting([
    path.join(
      enginesDir,
      isWin
        ? 'migration-engine-windows.exe'
        : isMac
          ? 'migration-engine-darwin'
          : 'migration-engine'
    ),
  ]);
  if (!schemaEngine || !migrationEngine) {
    throw new Error('[Migration] schema/migration engine 바이너리를 찾지 못했습니다.');
  }

  return { queryLib, schemaEngine, migrationEngine };
}

// ── Prisma CLI (asar 내부) 경로 ────────────────────────────────────────────────
function prismaCliInsideAsar(resources: string) {
  const cli = path.join(resources, 'app.asar', 'node_modules', 'prisma', 'build', 'index.js');
  if (!existsSync(cli)) {
    throw new Error(
      `[Migration] app.asar 내부의 Prisma CLI를 찾지 못했습니다: ${cli}\n` +
        'node_modules를 extraResources로 분리 복사하지 말고, asar에 그대로 포함시키세요.'
    );
  }
  return cli;
}

// ── 메인 함수 ────────────────────────────────────────────────────────────────
export async function runPrismaMigrations(databaseUrl: string): Promise<void> {
  console.log('[Migration] Prisma 마이그레이션 시작…');

  const dbPath = databaseUrl.replace(SQLITE_FILE_PREFIX, '');
  const lockPath = path.join(path.dirname(dbPath), MIGRATION_LOCK_FILE);
  if (!acquireMigrationLock(lockPath)) return;

  try {
    const resources = process.resourcesPath; // .../YourApp/resources
    const schemaPath = path.join(resources, 'prisma', 'schema.prisma');
    const migrations = path.join(resources, 'prisma', 'migrations');

    if (!existsSync(schemaPath) || !existsSync(migrations)) {
      console.warn('[Migration] schema/migrations 없음 → 건너뜀.');
      return;
    }

    // 1) 엔진 경로(언팩) 확보
    const { queryLib, schemaEngine, migrationEngine } = resolvePrismaEngines(resources);

    // 2) CLI는 app.asar 내부에서 실행 (의존성 트리 보존)
    const cli = prismaCliInsideAsar(resources);

    await new Promise<void>((resolve, reject) => {
      const args = ['migrate', 'deploy', '--schema', schemaPath];

      const child = fork(cli, args, {
        stdio: 'inherit',
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1', // Electron exe를 Node처럼
          DATABASE_URL: databaseUrl,
          // 엔진 경로 명시(플랫폼 상관없이 확실하게)
          PRISMA_QUERY_ENGINE_LIBRARY: queryLib,
          PRISMA_SCHEMA_ENGINE_BINARY: schemaEngine,
          PRISMA_MIGRATION_ENGINE_BINARY: migrationEngine,
          // 모듈 해상도 안전망: asar/외부 양쪽 node_modules 모두 검색
          NODE_PATH: [
            path.join(resources, 'app.asar', 'node_modules'),
            path.join(resources, 'node_modules'), // 혹시 extraResources로 둔 게 있다면
          ].join(path.delimiter),
        },
      });

      child.on('exit', (code) => {
        if (code === 0) {
          console.info('[Migration] 마이그레이션 완료.');
          resolve();
        } else {
          reject(new Error(`[Migration] 프로세스 종료 코드: ${code}`));
        }
      });
      child.on('error', reject);
    });
  } catch (e) {
    console.error('[Migration] 실패:', e);
    // 실패 시 앱을 계속 띄우지 않으려면 다음 줄 주석 해제
    // app.quit();
  } finally {
    console.log('[Migration] 락 해제.');
    releaseMigrationLock(lockPath);
  }
}
