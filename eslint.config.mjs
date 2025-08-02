import eslintPluginTypeScript from '@typescript-eslint/eslint-plugin';
import parserTypeScript from '@typescript-eslint/parser';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [".eslintrc.js", "node_modules/", "dist/"],
    languageOptions: {
      parser: parserTypeScript,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: {
        node: true,
        jest: true,
      },
    },
    plugins: {
      '@typescript-eslint': eslintPluginTypeScript,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
    settings: {
      'import/resolver': {
        typescript: {
          // This tells the resolver to use your tsconfig.json
          // You can specify multiple tsconfig files if you have them, e.g.,
          // project: ['tsconfig.json', 'packages/*/tsconfig.json']
          project: './tsconfig.json',
        },
        // The 'node' resolver is also implicitly used by default,
        // but sometimes explicitly defining it helps, especially if
        // you want to control its extensions.
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      // You might also need to explicitly tell import plugin about allowed extensions
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
      // If you are in a monorepo with Yarn PnP or similar, you might need:
      // 'import/external-module-folders': ['node_modules', '.yarn'],
    },
    rules: {
      ...eslintPluginTypeScript.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      ...configPrettier.rules,
      'prettier/prettier': ['error', { 'endOfLine': 'auto' }],
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: false },
        },
      ],
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    languageOptions: {
      globals: {
        jest: true
      }
    },
    rules: {
      // Specific Jest rules if you use an ESLint Jest plugin
    }
  }
];