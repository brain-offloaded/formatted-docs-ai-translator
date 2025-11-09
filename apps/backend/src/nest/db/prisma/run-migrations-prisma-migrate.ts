// import path from 'path';
// import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
// import { errorToString } from '@/nest/utils/error-stringify';

// // 마이그레이션 락 파일을 사용하여 중복 실행 방지
// function acquireMigrationLock(lockPath: string): boolean {
//   try {
//     if (existsSync(lockPath)) {
//       // 락 파일이 존재하면 내용 확인 (PID와 타임스탬프)
//       const lockContent = readFileSync(lockPath, 'utf-8');
//       const [, timestamp] = lockContent.split(':');
//       const lockTime = parseInt(timestamp, 10);
//       const currentTime = Date.now(); // 5분 이상 지난 락은 stale로 간주

//       if (currentTime - lockTime > 5 * 60 * 1000) {
//         console.warn('Stale 마이그레이션 락 파일 발견 (5분 초과), 제거합니다.');
//         unlinkSync(lockPath);
//       } else {
//         console.info(`마이그레이션이 이미 실행 중이거나 최근에 완료되었습니다.`);
//         return false;
//       }
//     } // 락 파일 생성 (PID와 타임스탬프)

//     writeFileSync(lockPath, `${process.pid}:${Date.now()}`, 'utf-8');
//     return true;
//   } catch (err) {
//     console.error('마이그레이션 락 획득 실패:', err);
//     return false;
//   }
// }

// function releaseMigrationLock(lockPath: string): void {
//   try {
//     if (existsSync(lockPath)) {
//       unlinkSync(lockPath);
//     }
//   } catch (err) {
//     console.warn('마이그레이션 락 해제 실패:', err);
//   }
// }

// // Runs prisma migrate deploy using Prisma programmatic API
// export async function runPrismaMigrations(databaseUrl: string): Promise<void> {
//   let migrationLockPath: string | null = null;

//   try {
//     // Ensure DATABASE_URL is set for the migrate engine.
//     process.env.DATABASE_URL = databaseUrl; // 락 파일 경로 설정 (DB 파일과 같은 디렉토리)

//     const dbPath = databaseUrl.replace('file:', '');
//     migrationLockPath = path.join(path.dirname(dbPath), '.migration.lock'); // 락 획득 시도

//     if (!acquireMigrationLock(migrationLockPath)) {
//       return;
//     } // Locate schema & migrations (copied via extraResources outside asar).

//     const resourcesRoot = process.resourcesPath; // Electron production root
//     const schemaPath = path.join(resourcesRoot, 'prisma', 'schema.prisma');
//     const migrationsDir = path.join(resourcesRoot, 'prisma', 'migrations');

//     if (!existsSync(schemaPath)) {
//       console.log(schemaPath);
//       console.warn('schema.prisma 파일을 찾을 수 없습니다. 마이그레이션을 건너뜁니다.');
//       releaseMigrationLock(migrationLockPath);
//       return;
//     }
//     if (!existsSync(migrationsDir)) {
//       console.warn('migrations 디렉토리를 찾을 수 없습니다. 마이그레이션을 건너뜁니다.');
//       releaseMigrationLock(migrationLockPath);
//       return;
//     }

//     console.info('Prisma 마이그레이션 적용 시작 (deploy)...');

//     const { Migrate } = await import('@prisma/migrate');

//     // 스키마 파일 내용 읽기 (schemaContext에 넣기 위함)
//     const schemaContent = readFileSync(schemaPath, 'utf8');

//     // ❗ new Migrate(schemaPath) 대신 setup() 사용 + migrationsDirPath 제공
//     const migrate = await Migrate.setup({
//       // applyMigrations 에는 migrationsDirPath가 필수
//       migrationsDirPath: migrationsDir,
//       schemaContext: {
//         schemaFiles: [schemaPath, schemaContent],
//       } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
//     });

//     try {
//       const result = await migrate.applyMigrations(); // 사실상 `migrate deploy`
//       console.info('Prisma 마이그레이션 적용 완료:', result?.appliedMigrationNames ?? []);
//     } finally {
//       await migrate.stop(); // 🔒 엔진 정리 - await 필수
//     }
//   } catch (err) {
//     console.error('Prisma 마이그레이션 처리 중 예외 발생:', { error: errorToString(err) });
//   } finally {
//     if (migrationLockPath) {
//       releaseMigrationLock(migrationLockPath);
//     }
//   }
// }
