import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

export function createWorkspaceEslintConfig({ workspaceDir, ignores = [], withReact = true }) {
  if (!workspaceDir) {
    throw new Error('workspaceDir is required to build the ESLint config');
  }

  const compat = new FlatCompat({
    baseDirectory: workspaceDir,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
  });

  const plugins = ['@typescript-eslint', 'import', 'prettier'];
  if (withReact) {
    plugins.push('react', 'react-hooks', 'jsx-a11y');
  }

  const bases = [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ];

  if (withReact) {
    bases.push('plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended');
  }

  const settings = {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  };

  if (withReact) {
    settings.react = { version: 'detect' };
  }

  const rules = {
    'import/no-unresolved': 'off',
    'import/order': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
  };

  if (withReact) {
    rules['react/prop-types'] = 'off';
    rules['react/react-in-jsx-scope'] = 'off';
  }

  const configs = compat
    .config({
      parser: '@typescript-eslint/parser',
      plugins,
      extends: bases,
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
      settings,
      rules,
    })
    .map((config) => ({
      ...config,
      files: ['**/*.{ts,tsx}'],
    }));

  return [
    {
      ignores: ['**/node_modules/**', '**/dist/**', ...ignores],
    },
    {
      linterOptions: {},
    },
    ...configs,
  ];
}

export default createWorkspaceEslintConfig;
