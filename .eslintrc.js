require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname, // this is the reason this is a .js file
        project: ['./tsconfig.eslint.json'],
    },
    extends: [
        '@rubensworks'
    ],
    rules: {
        'no-implicit-coercion': 'off'
    },
    globals: {
        'AsyncIterableIterator': true,
    },
};
