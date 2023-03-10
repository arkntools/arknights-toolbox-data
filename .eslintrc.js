const offTsRules = [
  'strict-boolean-expressions',
  'prefer-nullish-coalescing',
  'no-non-null-assertion',
  'promise-function-async',
  'explicit-function-return-type',
  'no-floating-promises',
  'no-misused-promises',
  'restrict-template-expressions',
];

module.exports = {
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  extends: ['standard-ts', 'plugin:import/recommended', 'plugin:import/typescript', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    ...Object.fromEntries(offTsRules.map(name => [`@typescript-eslint/${name}`, 'off'])),
    yoda: 'off',
    'prettier/prettier': 'warn',
    'import/order': 'warn',
    'import/no-named-as-default': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'warn',
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/consistent-type-assertions': [
      'warn',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow-as-parameter',
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
