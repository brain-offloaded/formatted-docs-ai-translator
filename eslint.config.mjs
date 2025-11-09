import { fileURLToPath } from 'node:url';
import path from 'node:path';

import createWorkspaceEslintConfig from './eslint.workspace.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default createWorkspaceEslintConfig({
  workspaceDir: __dirname,
  ignores: ['apps/frontend/src/react/api/generated/**'],
});
