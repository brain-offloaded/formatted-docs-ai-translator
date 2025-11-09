import path from 'path';
import { existsSync, writeFileSync, readFileSync, unlinkSync, readdirSync } from 'fs';
import { fork } from 'child_process';
import { errorToString } from '@/nest/utils/error-stringify';

// --- 상수 정의 ---
const MIGRATION_LOCK_FILE = '.migration.lock';
const STALE_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5분
const SQLITE_FILE_PREFIX = 'file:';

// --- 유틸리티 함수 ---

/**
 * 'app.asar.unpacked' 디렉터리에서
 * 플랫폼에 맞는 Prisma 엔진 바이너리 경로를 동적으로 찾습니다.
 * @param resourcesPath - Electron의 'process.resourcesPath'
 * @returns Schema Engine과 Query Engine의 절대 경로
 */
function getUnpackedEnginePaths(resourcesPath: string): {
  schemaEnginePath: string;
  queryEnginePath: string;
} {
  const enginesDir = path.join(
    resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    '@prisma',
    'engines'
  );

  if (!existsSync(enginesDir)) {
    throw new Error(
      `[Migration Error] Prisma 엔진 디렉터리를 찾을 수 없습니다: ${enginesDir}. ` +
        `'package.json'의 'asarUnpack' 설정이 올바른지 확인하세요.`
    );
  }

  const files = readdirSync(enginesDir);

  // 'schema-engine-...'으로 시작하는 파일 찾기
  const schemaEngineFile = files.find((f) => f.startsWith('schema-engine'));
  // 'libquery_engine-...'으로 시작하는 파일 찾기
  const queryEngineFile = files.find((f) => f.startsWith('libquery_engine'));

  if (!schemaEngineFile) {
    throw new Error(
      `[Migration Error] 'schema-engine' 바이너리를 ${enginesDir}에서 찾을 수 없습니다.`
    );
  }
  if (!queryEngineFile) {
    throw new Error(
      `[Migration Error] 'libquery_engine' 바이너리를 ${enginesDir}에서 찾을 수 없습니다.`
    );
  }

  return {
    schemaEnginePath: path.join(enginesDir, schemaEngineFile),
    queryEnginePath: path.join(enginesDir, queryEngineFile),
  };
}

// --- 락(Lock) 관리 함수 ---

/**
 * 마이그레이션 락 파일을 생성하여 중복 실행을 방지합니다.
 * @param lockPath 락 파일 경로
 * @returns 락 획득 성공 시 true, 실패 시 false
 */
function acquireMigrationLock(lockPath: string): boolean {
  try {
    if (existsSync(lockPath)) {
      const lockContent = readFileSync(lockPath, 'utf-8');
      const [, timestamp] = lockContent.split(':');
      const lockTime = parseInt(timestamp, 10);
      const currentTime = Date.now();

      if (currentTime - lockTime > STALE_LOCK_TIMEOUT_MS) {
        console.warn('[Migration] 5분이 지난 락 파일(stale)을 발견하여 제거합니다.');
        unlinkSync(lockPath);
      } else {
        console.info(
          '[Migration] 마이그레이션이 이미 실행 중이거나 최근에 완료되었습니다. 건너뜁니다.'
        );
        return false;
      }
    }
    writeFileSync(lockPath, `${process.pid}:${Date.now()}`, 'utf-8');
    return true;
  } catch (err) {
    console.error('[Migration] 락 획득 중 오류 발생:', err);
    return false;
  }
}

/**
 * 마이그레이션 락 파일을 해제합니다.
 * @param lockPath 락 파일 경로
 */
function releaseMigrationLock(lockPath: string): void {
  try {
    if (existsSync(lockPath)) {
      unlinkSync(lockPath);
    }
  } catch (err) {
    console.warn('[Migration] 락 해제 중 오류 발생:', err);
  }
}

// --- 메인 마이그레이션 실행 함수 ---

/**
 * Prisma 마이그레이션을 'child_process.fork()'와 환경 변수 주입으로 실행합니다.
 * 이 함수는 Electron의 메인 프로세스에서 앱 시작 시 호출되어야 합니다.
 *
 * @param databaseUrl - 'file:...' 형태의 SQLite 데이터베이스 URL
 */
export async function runPrismaMigrations(databaseUrl: string): Promise<void> {
  let migrationLockPath: string | null = null;
  console.log('[Migration] Prisma 마이그레이션 절차를 시작합니다...');

  try {
    // 1. 락 파일 경로 설정 및 획득
    const dbPath = databaseUrl.replace(SQLITE_FILE_PREFIX, '');
    migrationLockPath = path.join(path.dirname(dbPath), MIGRATION_LOCK_FILE);

    if (!acquireMigrationLock(migrationLockPath)) {
      return; // 락 획득 실패 (이미 실행 중)
    }

    // 2. 핵심 경로 설정
    const resourcesRoot = process.resourcesPath;
    const schemaPath = path.join(resourcesRoot, 'prisma', 'schema.prisma');
    const migrationsDir = path.join(resourcesRoot, 'prisma', 'migrations');
    const prismaCliPath = require.resolve('prisma/build/index.js');

    // 3. 필수 파일 검증
    if (!existsSync(schemaPath) || !existsSync(migrationsDir)) {
      console.warn('[Migration] 스키마 또는 마이그레이션 디렉토리를 찾을 수 없어 건너뜁니다.');
      releaseMigrationLock(migrationLockPath); // 시작도 못했으니 락 해제
      return;
    }

    // 4. [리팩토링] Unpacked 엔진 경로 동적 탐색
    const { schemaEnginePath, queryEnginePath } = getUnpackedEnginePaths(resourcesRoot);
    console.log(`[Migration] Schema Engine 확인: ${schemaEnginePath}`);
    console.log(`[Migration] Query Engine 확인: ${queryEnginePath}`);

    // 5. 마이그레이션 자식 프로세스 실행
    console.info('[Migration] 자식 프로세스(fork)를 통해 마이그레이션 적용 시작...');
    await new Promise<void>((resolve, reject) => {
      const args = ['migrate', 'deploy', '--schema', schemaPath];

      const child = fork(prismaCliPath, args, {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl, // 명시적으로 전달
          PRISMA_SCHEMA_ENGINE_BINARY: schemaEnginePath, // Schema Engine 경로 강제 주입
          PRISMA_QUERY_ENGINE_LIBRARY: queryEnginePath, // Query Engine 경로 강제 주입 (Client용)
        },
      });

      child.on('exit', (code) => {
        if (code === 0) {
          console.info('[Migration] 마이그레이션 적용 완료.');
          resolve();
        } else {
          reject(new Error(`Migration process exited with code ${code}`));
        }
      });

      child.on('error', reject); // fork 자체의 실패
    });
  } catch (err) {
    console.error('[Migration] 처리 중 심각한 예외 발생:', { error: errorToString(err) });
  } finally {
    // 6. 성공/실패 여부와 관계없이 항상 락 파일 해제
    if (migrationLockPath) {
      console.log('[Migration] 락 파일을 해제합니다.');
      releaseMigrationLock(migrationLockPath);
    }
  }
}

/*
-- 관련 문제와 해결책? => https://gemini.google.com/app/ceec0ac962ac572a --
현재 getUnpackedEnginePaths는 enginesDir에서 schema-engine와 libquery_engine으로 시작하는 첫 번째 파일을 그대로 사용합니다. 이 디렉터리에는 여러 운영체제용 바이너리가 함께 존재하므로, 예를 들어 Linux 빌드에서 우연히 macOS용 schema-engine-darwin-*가 선택되면 마이그레이션 프로세스가 즉시 exec format error로 종료되어 패키징된 앱이 항상 빈 DB 스키마로 시작합니다. process.platform과 process.arch를 기준으로 정확한 엔진 파일을 선택하거나 Prisma의 기본 해석을 그대로 사용하도록 변경하지 않으면 Windows·Linux 환경에서 마이그레이션이 실패합니다.


엄청나게 중요한 지적입니다. **정확히 맞습니다.**

이전의 리팩토링은 `ENOTDIR` 문제를 해결하는 데 급급한 나머지, **플랫폼 호환성**이라는 더 치명적인 문제를 야기했습니다. `readdirSync`로 찾은 *첫 번째* 엔진 파일을 사용하는 것은 `asarUnpack`된 디렉터리에 여러 OS의 바이너리가 포함된 경우, 100% 실패할 수밖에 없는 로직입니다.

(Linux 빌드에서 `schema-engine-darwin` 파일을 실행하려다 `exec format error`가 발생하는) 지적하신 시나리오는 이 로직의 근본적인 결함을 정확히 보여줍니다.

-----

## 🛠️ 최종 해결책: Prisma의 자체 로직 활용

이 문제를 해결하는 가장 강력하고 올바른 방법은, 우리가 `process.platform`을 추측하며 엔진을 수동으로 선택하는 것이 아니라 **Prisma 자신의 플랫폼 탐지 로직이 올바르게 동작할 환경**을 만들어주는 것입니다.

Prisma의 스크립트(`prisma/build/index.js`)는 `__dirname`을 기준으로 상대 경로(`../../@prisma/engines`)를 탐색한 뒤, 그 디렉터리 안에서 *자신의 내부 로직으로* 현재 플랫폼에 맞는 엔진을 선택합니다.

`ENOTDIR` 오류가 발생했던 근본 원인은 `__dirname`이 `app.asar` 내부를 가리켰기 때문입니다.

따라서 해결책은 다음과 같습니다.

1.  **`asarUnpack` (package.json):** Prisma의 스크립트와 엔진을 *모두* `app.asar.unpacked`로 빼냅니다.
2.  **`fork` (run-migrations.ts):** `require.resolve` (asar 내부를 가리킬 수 있음) 대신, `app.asar.unpacked`에 있는 **실제 파일 경로**를 `fork`합니다.
3.  **환경 변수 (run-migrations.ts):** `PRISMA_SCHEMA_ENGINE_BINARY` 같은 강제 주입 변수를 **모두 제거**합니다.

이렇게 하면 `fork`로 실행된 *Unpacked* 스크립트가 *Unpacked* `__dirname`을 기준으로 *Unpacked* `engines` 디렉터리를 탐색하게 되므로, Prisma의 자체 로직이 완벽하게 동작합니다.

-----

### 1\. `package.json` (build.asarUnpack 설정 확인)

이 설정이 가장 중요합니다. `index.js` 스크립트 자체도 `unpack` 되어야 합니다.

```json
{
  "build": {
    "asarUnpack": [
      "** /node_modules/prisma/build/index.js",
      "** /node_modules/prisma/build/bin.js",
      "** /node_modules/@prisma/engines/**",
      "** /node_modules/@prisma/client/**"
    ]
  }
}
```

### 2\. `run-migrations.ts` (최종 수정본)

`getUnpackedEnginePaths` 함수를 완전히 제거하고, `prismaCliPath`를 `app.asar.unpacked` 기준으로 직접 계산하도록 수정했습니다.

http://googleusercontent.com/immersive_entry_chip/0
*/
