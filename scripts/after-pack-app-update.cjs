const fs = require('fs/promises');
const path = require('path');

module.exports = async function afterPack(context) {
  const appOutDir = context.appOutDir;
  const repoRoot = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(repoRoot, 'package.json');

  let publishConfig;
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const publish = packageJson.build && Array.isArray(packageJson.build.publish) ? packageJson.build.publish[0] : null;

    if (!publish || !publish.provider || !publish.owner || !publish.repo) {
      console.warn('[afterPack] publish 설정을 찾을 수 없어 app-update.yml 생성을 건너뜁니다.');
      return;
    }
    publishConfig = publish;
  } catch (error) {
    console.warn('[afterPack] package.json을 읽는 중 오류가 발생하여 app-update.yml 생성을 건너뜁니다.', error);
    return;
  }

  const lines = [
    `provider: ${publishConfig.provider}`,
    `owner: ${publishConfig.owner}`,
    `repo: ${publishConfig.repo}`,
  ];

  if (publishConfig.private !== undefined) {
    lines.push(`private: ${publishConfig.private}`);
  }
  if (publishConfig.releaseType) {
    lines.push(`releaseType: ${publishConfig.releaseType}`);
  }

  const appUpdatePath = path.join(appOutDir, 'resources', 'app-update.yml');
  await fs.mkdir(path.dirname(appUpdatePath), { recursive: true });
  await fs.writeFile(appUpdatePath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`[afterPack] ${appUpdatePath} 생성 완료`);
};
