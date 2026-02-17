import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const distSource = path.join(repoRoot, 'dist');
const indexHtmlSource = path.join(repoRoot, 'index.html');
const stagingDir = path.join(repoRoot, 'apps', 'backend', 'app');
const stagingDistDir = path.join(stagingDir, 'dist');
const stagingNodeModulesDir = path.join(stagingDir, 'node_modules');
const commonDistSource = path.join(repoRoot, 'apps', 'common', 'dist');
const rootNodeModules = path.join(repoRoot, 'node_modules');
const rootPackagePath = path.join(repoRoot, 'package.json');
const backendPackagePath = path.join(repoRoot, 'apps', 'backend', 'package.json');

async function ensureExists(targetPath, errorMessage) {
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(errorMessage);
  }
}

function toRuntimeDependencies(packageJson) {
  return Object.entries(packageJson?.dependencies ?? {})
    .filter(([name]) => !name.startsWith('@apps/'))
    .reduce((acc, [name, version]) => {
      acc[name] = version;
      return acc;
    }, {});
}

function sortDependencyMap(dependencies) {
  return Object.fromEntries(Object.entries(dependencies).sort(([a], [b]) => a.localeCompare(b)));
}

async function collectWorkspaceRuntimeDependencies(dependencies) {
  const workspaceDeps = Object.keys(dependencies ?? {}).filter((name) => name.startsWith('@apps/'));
  if (workspaceDeps.length === 0) {
    return {};
  }

  const runtimeDeps = {};
  for (const workspaceDep of workspaceDeps) {
    const workspaceName = workspaceDep.replace('@apps/', '');
    const workspacePackagePath = path.join(repoRoot, 'apps', workspaceName, 'package.json');
    try {
      const workspacePackage = JSON.parse(await fs.readFile(workspacePackagePath, 'utf-8'));
      Object.assign(runtimeDeps, toRuntimeDependencies(workspacePackage));
    } catch (error) {
      console.warn(`워크스페이스 의존성 수집 실패: ${workspaceDep} (${error.message ?? error})`);
    }
  }

  return runtimeDeps;
}

/**
 * Automatically sync runtime dependencies from backend to root package.json
 * This eliminates manual dependency duplication
 */
async function syncRootDependencies(backendPackage) {
  const rootPackage = JSON.parse(await fs.readFile(rootPackagePath, 'utf-8'));

  const backendRuntimeDeps = toRuntimeDependencies(backendPackage);
  const workspaceRuntimeDeps = await collectWorkspaceRuntimeDependencies(backendPackage.dependencies);
  const runtimeDeps = sortDependencyMap({
    ...workspaceRuntimeDeps,
    ...backendRuntimeDeps,
  });

  const versionConflicts = Object.entries(workspaceRuntimeDeps).filter(
    ([name, workspaceVersion]) =>
      backendRuntimeDeps[name] && backendRuntimeDeps[name] !== workspaceVersion
  );
  if (versionConflicts.length > 0) {
    const conflictNames = versionConflicts.map(([name]) => name).join(', ');
    console.log(`백엔드 의존성 버전을 우선 적용합니다: ${conflictNames}`);
  }

  // Check if root dependencies need update
  const currentRootDeps = sortDependencyMap(rootPackage.dependencies ?? {});
  const needsUpdate = JSON.stringify(currentRootDeps) !== JSON.stringify(runtimeDeps);

  if (needsUpdate) {
    console.log('루트 package.json dependencies 자동 동기화 중...');
    rootPackage.dependencies = runtimeDeps;
    await fs.writeFile(rootPackagePath, JSON.stringify(rootPackage, null, 2) + '\n');

    // Trigger yarn install to sync lockfile
    console.log('yarn install 실행 중...');
    try {
      await execAsync('yarn install', { cwd: repoRoot });
    } catch (error) {
      console.warn('yarn install 경고:', error.message);
    }
  }

  return rootPackage;
}

async function createRuntimePackageJson(rootPackage, backendPackage) {
  const appPackageJson = {
    name: rootPackage.name,
    version: rootPackage.version,
    description: rootPackage.description,
    author: rootPackage.author,
    license: rootPackage.license,
    main: 'dist/main.js',
    dependencies: backendPackage.dependencies ?? {},
  };

  await fs.writeFile(path.join(stagingDir, 'package.json'), JSON.stringify(appPackageJson, null, 2));
}

/**
 * Intelligently copy node_modules with caching and filtering
 * Skips dev dependencies and uses timestamp-based caching
 */
async function copyNodeModulesSelectively() {
  // Check if staging node_modules exists and is recent
  try {
    const stagingStat = await fs.stat(stagingNodeModulesDir);
    const rootStat = await fs.stat(rootNodeModules);
    
    // If staging is newer than root, skip copy
    if (stagingStat.mtimeMs > rootStat.mtimeMs) {
      console.log('node_modules 캐시 사용 (복사 스킵)');
      return;
    }
  } catch {
    // Directory doesn't exist, proceed with copy
  }
  
  console.log('Production dependencies 복사 중 (rsync 사용)...');
  
  // Exclude dev-only packages to reduce copy time
  const excludePatterns = [
    '.cache',
    '.bin',
    '@apps',
    'turbo',
    'electron',
    'electron-builder',
    'eslint*',
    'prettier',
    'typescript',
    '@typescript-eslint',
    'ts-node',
    'jest',
    '@jest',
    'nodemon',
    'concurrently',
    'rimraf',
    '@nestjs/cli',
    '@nestjs/testing',
    'webpack*',
    '@babel',
    '@webpack-cli',
    'html-webpack-plugin',
    'css-loader',
    'style-loader',
  ];
  
  const excludeArgs = excludePatterns.map(p => `--exclude="${p}"`).join(' ');
  
  try {
    const cmd = `rsync -a --delete-excluded ${excludeArgs} ${rootNodeModules}/ ${stagingNodeModulesDir}/`;
    await execAsync(cmd);
  } catch (error) {
    // Fallback to fs.cp if rsync not available
    console.log('rsync 실패, 일반 복사 사용...');
    await fs.cp(rootNodeModules, stagingNodeModulesDir, {
      recursive: true,
      filter: (src) => {
        const rel = path.relative(rootNodeModules, src);
        return !excludePatterns.some(p => rel.startsWith(p.replace('*', '')));
      }
    });
  }
}

async function prepare() {
  await ensureExists(distSource, 'dist 디렉터리가 없습니다. 먼저 `yarn build`를 실행해주세요.');
  await ensureExists(indexHtmlSource, '루트 index.html 파일을 찾을 수 없습니다.');
  await ensureExists(rootPackagePath, '루트 package.json 파일을 찾을 수 없습니다.');
  await ensureExists(backendPackagePath, 'backend package.json 파일을 찾을 수 없습니다.');
  await ensureExists(commonDistSource, 'apps/common/dist가 없습니다. 먼저 `yarn build`를 실행해주세요.');

  const backendPackage = JSON.parse(await fs.readFile(backendPackagePath, 'utf-8'));
  
  // Auto-sync dependencies from backend to root
  const rootPackage = await syncRootDependencies(backendPackage);

  // Don't delete entire staging dir for caching
  console.log('이전 빌드 결과물 정리 중...');
  await fs.rm(stagingDistDir, { recursive: true, force: true });
  await fs.mkdir(stagingDistDir, { recursive: true });

  console.log('빌드 결과물 복사 중...');
  await fs.cp(distSource, stagingDistDir, { recursive: true });
  await fs.copyFile(indexHtmlSource, path.join(stagingDir, 'index.html'));

  await createRuntimePackageJson(rootPackage, backendPackage);

  // Copy node_modules with caching
  await copyNodeModulesSelectively();
  
  // Ensure @apps/common is accessible
  const appsInStaging = path.join(stagingNodeModulesDir, '@apps');
  const commonInStaging = path.join(appsInStaging, 'common');
  await fs.mkdir(appsInStaging, { recursive: true });
  
  console.log('@apps/common 준비 중...');
  await fs.rm(path.join(commonInStaging, 'dist'), { recursive: true, force: true });
  await fs.cp(commonDistSource, path.join(commonInStaging, 'dist'), { recursive: true });
  
  const commonPackage = JSON.parse(
    await fs.readFile(path.join(repoRoot, 'apps', 'common', 'package.json'), 'utf-8')
  );
  const commonRuntimeDeps = sortDependencyMap(toRuntimeDependencies(commonPackage));
  await fs.writeFile(
    path.join(commonInStaging, 'package.json'),
    JSON.stringify(
      {
        name: commonPackage.name,
        version: commonPackage.version,
        main: 'dist/index.js',
        dependencies: commonRuntimeDeps,
      },
      null,
      2
    )
  );

  // Fix Prisma location
  const rootPrismaDir = path.join(rootNodeModules, '.prisma');
  const clientPrismaDir = path.join(stagingNodeModulesDir, '@prisma', 'client', '.prisma');
  try {
    await fs.access(rootPrismaDir);
    await fs.rm(clientPrismaDir, { recursive: true, force: true });
    await fs.mkdir(path.dirname(clientPrismaDir), { recursive: true });
    await fs.cp(rootPrismaDir, clientPrismaDir, { recursive: true });
  } catch {
    // ignore
  }

  console.log('패키징용 app 디렉터리를 준비 완료 (electron-builder skip npm install)');
}

prepare().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
