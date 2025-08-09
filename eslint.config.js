import {
  baseConfig,
  configFilesConfig,
  typescriptConfig,
  typescriptDefinitionsConfig,
  vitestConfig,
} from '@arabasta/eslint-config';
// eslint-disable-next-line import/no-extraneous-dependencies
import globals from 'globals';
// import/no-unresolved doesn't support node "exports" field. https://github.com/import-js/eslint-plugin-import/issues/1810
// eslint-disable-next-line import/no-unresolved
import tseslint from 'typescript-eslint';

const typeScriptExtensions = ['ts', 'cts', 'mts', 'tsx'];

const typeScriptDefinitionExtensions = typeScriptExtensions
  .filter((x) => x !== 'tsx')
  .map((x) => `d.${x}`);

const allExtensions = [
  'js',
  'cjs',
  'mjs',
  'jsx',
  'json',
  ...typeScriptExtensions,
];

export default tseslint.config(
  // We use a tseslint helper function here so that we get easy "extends"
  // functionality that eslint flat config makes hard to achieve.
  // You can use this for the convenience, without using TypeScript.
  // Ideally this helper function should be provided by eslint.
  // For more information: https://typescript-eslint.io/packages/typescript-eslint/#flat-config-extends
  ...tseslint.config({
    name: 'All files',
    files: [`**/*.+(${allExtensions.join('|')})`],
    extends: [...baseConfig],
    settings: {
      'import/extensions': allExtensions.map((ext) => `.${ext}`),
      'import/resolver': {
        node: {
          extensions: allExtensions.map((ext) => `.${ext}`),
        },
      },
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
    },
    rules: {
      'prefer-destructuring': 'off',
      'no-restricted-imports': 'off',
      '@arabasta/javascript/report-caught-error': 'off',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './',
              from: `./src/**/*.+(spec|test).+(${allExtensions.join('|')})`,
              message: 'Importing test files in non-test files is not allowed.',
            },
            {
              target: './',
              from: `./__mocks__`,
              message:
                'Importing mock modules in non-test files is not allowed.',
            },
            {
              target: './',
              from: './src/testing',
              message:
                'Importing testing utilities in non-test files is not allowed.',
            },
          ],
        },
      ],
      'import/extensions': [
        'error',
        allExtensions.reduce((acc, val) => {
          acc[val] = 'ignorePackages';
          return acc;
        }, {}),
      ],
      'es/no-optional-catch-binding': 'off',
    },
  }),

  ...tseslint.config({
    name: 'TypeScript files',
    files: [`**/*.+(${typeScriptExtensions.join('|')})`],
    extends: [...typescriptConfig],
    rules: {
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          selector: 'variable',
        },
        {
          selector: 'variable',
          filter: {
            regex: '^(__filename|__dirname)$',
            match: true,
          },
          format: null,
        },
      ],
    },
  }),

  ...tseslint.config({
    name: 'TypeScript definition files',
    files: [`**/*.+(${typeScriptDefinitionExtensions.join('|')})`],
    extends: [...typescriptDefinitionsConfig],
    rules: {
      // Put your rules here.
    },
  }),

  ...tseslint.config({
    name: 'Root level configuration files',
    files: [
      `*.+(${allExtensions.join('|')})`,
      `__mocks__/**/*.+(${allExtensions.join('|')})`,
    ],
    extends: [...configFilesConfig],
    rules: {
      // Put your rules here.
    },
  }),

  ...tseslint.config({
    name: 'Test files and test related infrastructure',
    files: [
      `src/**/*.+(spec|test).+(${allExtensions.join('|')})`,
      `src/testing/**/*.+(${allExtensions.join('|')})`,
      `__mocks__/**/*.+(${allExtensions.join('|')})`,
      'setupTests.ts',
      'vitest.config.ts',
    ],
    extends: [...vitestConfig],
    rules: {
      'import/no-nodejs-modules': 'off',
    },
  }),

  ...tseslint.config({
    name: 'NodeJS project',
    files: [
      `src/**/*.+(${allExtensions.join('|')})`,
      `scripts/**/*.+(${allExtensions.join('|')})`,
    ],
    rules: {
      'import/no-nodejs-modules': 'off',
      'no-underscore-dangle': [
        'error',
        {
          allow: ['__dirname', '__filename'],
        },
      ],
    },
  }),

  { ignores: ['dist', 'node_modules', '**/*.json'] }
);
