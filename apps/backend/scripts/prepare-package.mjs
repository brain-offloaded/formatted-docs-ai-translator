import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const distSource = path.join(repoRoot, 'dist');
const indexHtmlSource = path.join(repoRoot, 'index.html');
const stagingDir = path.resolve(__dirname, '..', 'app');
const stagingDistDir = path.join(stagingDir, 'dist');
const nodeModulesSource = path.join(repoRoot, 'node_modules');
const stagingNodeModulesDir = path.join(stagingDir, 'node_modules');
const rootPackagePath = path.join(repoRoot, 'package.json');
const backendPackagePath = path.join(repoRoot, 'apps', 'backend', 'package.json');

async function ensureExists(targetPath, errorMessage) {
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(errorMessage);
  }
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

async function prepare() {
  await ensureExists(distSource, 'dist 디렉터리가 없습니다. 먼저 `yarn build`를 실행해주세요.');
  await ensureExists(indexHtmlSource, '루트 index.html 파일을 찾을 수 없습니다.');
  await ensureExists(nodeModulesSource, 'node_modules 디렉터리가 없습니다. `yarn install`을 먼저 실행해주세요.');
  await ensureExists(rootPackagePath, '루트 package.json 파일을 찾을 수 없습니다.');
  await ensureExists(backendPackagePath, 'backend package.json 파일을 찾을 수 없습니다.');

  const rootPackage = JSON.parse(await fs.readFile(rootPackagePath, 'utf-8'));
  const backendPackage = JSON.parse(await fs.readFile(backendPackagePath, 'utf-8'));

  await fs.rm(stagingDir, { recursive: true, force: true });
  await fs.mkdir(stagingDistDir, { recursive: true });

  await fs.cp(distSource, stagingDistDir, { recursive: true });
  await fs.copyFile(indexHtmlSource, path.join(stagingDir, 'index.html'));

  await createRuntimePackageJson(rootPackage, backendPackage);

  console.log('node_modules 복사 중...(시간이 조금 걸릴 수 있습니다)');
  await fs.cp(nodeModulesSource, stagingNodeModulesDir, {
    recursive: true,
    dereference: false,
    filter: (src) => {
      const relativePath = path.relative(nodeModulesSource, src);
      if (!relativePath || relativePath === '' || relativePath.startsWith('..')) {
        return true;
      }

      const normalized = relativePath.replace(/\\/g, '/');

      if (normalized.startsWith('.cache/') || normalized.startsWith('.bin/')) {
        return false;
      }

      if (normalized.startsWith('@apps/')) {
        return false;
      }

      return true;
    },
  });

  // Ensure Prisma runtime files are colocated under @prisma/client/.prisma
  const rootPrismaDir = path.join(stagingNodeModulesDir, '.prisma');
  const clientPrismaDir = path.join(stagingNodeModulesDir, '@prisma', 'client', '.prisma');
  try {
    await fs.access(rootPrismaDir);
    await fs.rm(clientPrismaDir, { recursive: true, force: true });
    await fs.mkdir(path.dirname(clientPrismaDir), { recursive: true });
    await fs.cp(rootPrismaDir, clientPrismaDir, { recursive: true });
    console.log('Prisma client runtime prepared: copied .prisma -> @prisma/client/.prisma');
  } catch {
    // ignore when prisma was not generated
  }

  console.log('패키징용 app 디렉터리를 준비했습니다.');
}

prepare().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
