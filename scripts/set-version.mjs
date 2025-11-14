import fs from 'fs/promises';
import path from 'path';

async function setVersion() {
  const newVersion = process.argv[2];

  if (!newVersion) {
    console.error('Error: No version specified.');
    console.log('Usage: yarn version:set <new-version>');
    process.exit(1);
  }

  if (!/^\d+\.\d+\.\d+/.test(newVersion)) {
    console.error(`Error: Invalid version format "${newVersion}". Please use a valid semver format (e.g., 1.2.3).`);
    process.exit(1);
  }

  const rootDir = process.cwd();
  const packageJsonPaths = [path.join(rootDir, 'package.json')];

  try {
    const appsDir = path.join(rootDir, 'apps');
    const appFolders = await fs.readdir(appsDir);

    for (const appFolder of appFolders) {
      const appPath = path.join(appsDir, appFolder);
      const stat = await fs.stat(appPath);
      if (stat.isDirectory()) {
        const packageJsonPath = path.join(appPath, 'package.json');
        try {
          await fs.access(packageJsonPath);
          packageJsonPaths.push(packageJsonPath);
        } catch (e) {
          // ignore if no package.json
        }
      }
    }

    if (packageJsonPaths.length === 0) {
      console.error('Error: No package.json files found.');
      process.exit(1);
    }

    console.log(`Found ${packageJsonPaths.length} package.json files. Updating version to ${newVersion}...`);

    for (const filePath of packageJsonPaths) {
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const packageJson = JSON.parse(fileContent);
        
        const oldVersion = packageJson.version;
        packageJson.version = newVersion;
        
        const newFileContent = JSON.stringify(packageJson, null, 2) + '\n';
        
        await fs.writeFile(filePath, newFileContent, 'utf-8');
        const relativePath = path.relative(rootDir, filePath);
        console.log(`  - Updated ${relativePath}: ${oldVersion} -> ${newVersion}`);
      } catch (err) {
        console.error(`Error updating ${filePath}:`, err);
      }
    }

    console.log('\nVersion update complete!');
  } catch (err) {
    console.error('An error occurred:', err);
    process.exit(1);
  }
}

setVersion();
