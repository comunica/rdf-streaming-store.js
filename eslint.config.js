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
    // Async callbacks on setImmediate are used intentionally in tests
    files: [ 'test/**/*.ts' ],
    rules: {
      'ts/no-misused-promises': 'off',
    },
  },
  {
    // The webpack config only runs in Node.js
    files: [ 'webpack.config.js' ],
    rules: {
      'import/no-nodejs-modules': 'off',
    },
  },
]);
