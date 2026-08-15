const config = require('@rubensworks/eslint-config');

module.exports = config([
  {
    files: [ '**/*.ts' ],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [ './tsconfig.eslint.json' ],
      },
    },
  },
  {
    rules: {
      'no-implicit-coercion': 'off',
    },
  },
  {
    files: [ '**/test/**/*.ts' ],
    rules: {
      // Tests intentionally pass async callbacks to void-returning APIs such as setImmediate.
      'ts/no-misused-promises': [ 'error', { checksVoidReturn: false }],
    },
  },
  {
    ignores: [
      'coverage/**',
      '**/*.js',
      '**/*.d.ts',
      '**/*.js.map',
    ],
  },
]);
