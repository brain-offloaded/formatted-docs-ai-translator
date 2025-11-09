import { fileURLToPath } from 'node:url';
import path from 'node:path';

import createWorkspaceEslintConfig from '../../eslint.workspace.mjs';

const __filename = fileURLToPath(import.meta.url);
const workspaceDir = path.dirname(__filename);

export default createWorkspaceEslintConfig({
  workspaceDir,
  ignores: ['src/react/api/generated/**'],
});
