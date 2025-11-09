// import path from 'path';
// import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
// // child_process에서 'execSync' 대신 'fork'를 임포트합니다.
// import { fork } from 'child_process';

// /**
//  * 에러 객체를 문자열로 변환하는 유틸리티 함수 (예시)
//  * @/nest/utils/error-stringify 에 실제 함수가 있다고 가정합니다.
//  */
// function errorToString(err: unknown): string {
//   if (err instanceof Error) {
//     return err.stack || err.message;
//   }
//   return String(err);
// }

// // --- 락 파일 관련 함수 (기존 코드) ---

// /**
//  * 마이그레이션 락 파일을 생성하여 중복 실행을 방지합니다.
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

// // --- 메인 마이그레이션 실행 함수 (수정됨) ---

// /**
//  * Prisma 마이그레이션을 'child_process.fork()'를 사용해 안정적으로 실행합니다.
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

//     // 5. Prisma CLI 스크립트 실제 경로 탐색 (가장 중요)
//     // 'require.resolve'는 'app.asar' 내부의 'node_modules'에서도 잘 동작합니다.
//     const prismaCliPath = require.resolve('prisma/build/index.js');

//     // 6. 필수 파일 존재 여부 확인
//     if (!existsSync(schemaPath) || !existsSync(migrationsDir)) {
//       console.warn('스키마 또는 마이그레이션 디렉토리를 찾을 수 없어 건너뜁니다.');
//       // 락 파일을 해제해야 함
//       if (migrationLockPath) {
//         releaseMigrationLock(migrationLockPath);
//       }
//       return;
//     }

//     console.info('Prisma 마이그레이션 적용 시작 (child_process.fork)...');

//     // 7. fork를 사용하여 마이그레이션 스크립트 실행 (Promise로 감싸기)
//     await new Promise<void>((resolve, reject) => {
//       // fork에 전달할 CLI 인수 배열
//       const args: string[] = ['migrate', 'deploy', '--schema', schemaPath];

//       // Prisma CLI 스크립트(prismaCliPath)를 자식 Node.js 프로세스로 실행
//       const child = fork(prismaCliPath, args, {
//         stdio: 'inherit', // 자식 프로세스의 출력을 부모(현재 터미널)에 실시간 표시
//         env: process.env, // 'DATABASE_URL'이 포함된 환경 변수 전달
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
//     // 8. 성공하든 실패하든 항상 락 파일 해제
//     if (migrationLockPath) {
//       console.log('마이그레이션 락 파일을 해제합니다.');
//       releaseMigrationLock(migrationLockPath);
//     }
//   }
// }
