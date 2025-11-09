// import path from 'path';
// import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
// import { fork } from 'child_process';

// /**
//  * 에러 객체를 문자열로 변환하는 유틸리티 함수 (예시)
//  * 실제 구현에 맞게 수정하세요.
//  */
// function errorToString(err: unknown): string {
//   if (err instanceof Error) {
//     return err.stack || err.message;
//   }
//   return String(err);
// }

// // --- 락 파일 관련 함수 ---

// /**
//  * 마이G
//  * @param lockPath 락 파일 경로
//  * @returns 락 획득 성공 시 true, 실패 시 false
//  */
// function acquireMigrationLock(lockPath: string): boolean {
//   try {
//     if (existsSync(lockPath)) {
//       // 락 파일이 존재하면 내용 확인 (PID와 타임스탬프)
//       const lockContent = readFileSync(lockPath, 'utf-8');
//       const [, timestamp] = lockContent.split(':');
//       const lockTime = parseInt(timestamp, 10);
//       const currentTime = Date.now();

//       // 5분 이상 지난 락은 stale로 간주
//       if (currentTime - lockTime > 5 * 60 * 1000) {
//         console.warn('Stale 마이그레이션 락 파일 발견 (5분 초과), 제거합니다.');
//         unlinkSync(lockPath);
//       } else {
//         console.info(`마이그레이션이 이미 실행 중이거나 최근에 완료되었습니다.`);
//         return false;
//       }
//     }

//     // 락 파일 생성 (PID와 타임스탬프)
//     writeFileSync(lockPath, `${process.pid}:${Date.now()}`, 'utf-8');
//     return true;
//   } catch (err) {
//     console.error('마이그레이션 락 획득 실패:', err);
//     return false;
//   }
// }

// /**
//  * 마이그레이션 락 파일을 해제합니다.
//  * @param lockPath 락 파일 경로
//  */
// function releaseMigrationLock(lockPath: string): void {
//   try {
//     if (existsSync(lockPath)) {
//       unlinkSync(lockPath);
//     }
//   } catch (err) {
//     console.warn('마이그레이션 락 해제 실패:', err);
//   }
// }

// // --- 메인 마이그레이션 실행 함수 ---

// /**
//  * Prisma 마이그레이션을 'child_process.fork()'와 환경 변수 주입으로 실행합니다.
//  * 이 함수는 Electron의 메인 프로세스에서 앱 시작 시 호출되어야 합니다.
//  *
//  * @param databaseUrl - 'file:...' 형태의 SQLite 데이터베이스 URL
//  */
// export async function runPrismaMigrations(databaseUrl: string): Promise<void> {
//   let migrationLockPath: string | null = null;
//   console.log('Prisma 마이그레이션 절차를 시작합니다...');

//   try {
//     // 1. 자식 프로세스가 사용할 환경 변수 설정
//     process.env.DATABASE_URL = databaseUrl;

//     // 2. 락 파일 경로 설정
//     const dbPath = databaseUrl.replace('file:', '');
//     migrationLockPath = path.join(path.dirname(dbPath), '.migration.lock');

//     // 3. 락 획득 시도
//     if (!acquireMigrationLock(migrationLockPath)) {
//       // 락 획득 실패 시 (다른 프로세스 실행 중) 마이그레이션 건너뜀
//       return;
//     }

//     // 4. 리소스 경로 설정 (Electron 패키징 기준)
//     const resourcesRoot = process.resourcesPath; // 'app.asar' 외부의 'resources' 폴더
//     const schemaPath = path.join(resourcesRoot, 'prisma', 'schema.prisma');
//     const migrationsDir = path.join(resourcesRoot, 'prisma', 'migrations');

//     // 5. [핵심] 'app.asar.unpacked' 내부의 *실제 엔진 경로* 강제 지정
//     //    오류 로그에 나온 정확한 엔진 파일명을 사용해야 합니다.
//     //    (이 예시는 Linux 기준입니다. Windows/Mac에서는 파일명이 다릅니다.)
//     const engineName = 'schema-engine-debian-openssl-3.0.x';
//     const schemaEnginePath = path.join(
//       process.resourcesPath,
//       'app.asar.unpacked',
//       'node_modules',
//       '@prisma',
//       'engines',
//       engineName
//     );

//     // 6. [검증] 해당 경로에 엔진 파일이 실제로 존재하는지 확인
//     if (!existsSync(schemaEnginePath)) {
//       console.error(`[Migration Error] 치명적: Prisma 엔진이 'unpacked' 경로에 없습니다.`);
//       console.error(`[Migration Error] 탐색 경로: ${schemaEnginePath}`);
//       // 락 파일을 해제해야 함
//       if (migrationLockPath) {
//         releaseMigrationLock(migrationLockPath);
//       }
//       return;
//     } else {
//       console.log(`[Migration] Unpacked 엔진 확인: ${schemaEnginePath}`);
//     }

//     // 7. Prisma CLI 스크립트 실제 경로 탐색
//     const prismaCliPath = require.resolve('prisma/build/index.js');

//     // 8. 필수 파일 존재 여부 확인
//     if (!existsSync(schemaPath) || !existsSync(migrationsDir)) {
//       console.warn('스키마 또는 마이그레이션 디렉토리를 찾을 수 없어 건너뜁니다.');
//       if (migrationLockPath) {
//         releaseMigrationLock(migrationLockPath);
//       }
//       return;
//     }

//     console.info('Prisma 마이그레이션 적용 시작 (fork with env override)...');

//     // 9. fork를 사용하여 마이그레이션 스크립트 실행
//     await new Promise<void>((resolve, reject) => {
//       const args: string[] = ['migrate', 'deploy', '--schema', schemaPath];

//       const child = fork(prismaCliPath, args, {
//         stdio: 'inherit', // 자식 프로세스의 출력을 부모(현재 터미널)에 실시간 표시

//         // 10. [핵심] 환경 변수로 실제 엔진 경로를 강제 주입
//         env: {
//           ...process.env,
//           PRISMA_SCHEMA_ENGINE_BINARY: schemaEnginePath,
//           // Query Engine도 문제가 될 경우를 대비해 추가 (경로 수정 필요)
//           // PRISMA_QUERY_ENGINE_LIBRARY: queryEngineLibraryPath,
//         },
//       });

//       // 자식 프로세스 종료 이벤트 리스너
//       child.on('exit', (code) => {
//         if (code === 0) {
//           console.info('Prisma 마이그레이션 적용 완료.');
//           resolve(); // 성공
//         } else {
//           reject(new Error(`Migration process exited with code ${code}`)); // 실패
//         }
//       });

//       // 자식 프로세스 에러 이벤트 리스너
//       child.on('error', (err) => {
//         reject(err); // 실행 자체의 실패
//       });
//     });
//   } catch (err) {
//     console.error('Prisma 마이그레이션 처리 중 예외 발생:', { error: errorToString(err) });
//   } finally {
//     // 11. 성공하든 실패하든 항상 락 파일 해제
//     if (migrationLockPath) {
//       console.log('마이그레이션 락 파일을 해제합니다.');
//       releaseMigrationLock(migrationLockPath);
//     }
//   }
// }
