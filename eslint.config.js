import globals from 'globals';

const sharedRules = {
  'no-constant-condition': ['error', { checkLoops: false }],
  'no-debugger': 'error',
  'no-dupe-else-if': 'error',
  'no-fallthrough': 'error',
  'no-redeclare': 'error',
  'no-undef': 'error',
  'no-unreachable': 'error',
  'no-unused-vars': ['error', {
    args: 'after-used',
    argsIgnorePattern: '^_',
    caughtErrors: 'none',
    varsIgnorePattern: '^(setLang|toggleLangBn|toggleMobileMenu|setBottomActive|filterNews|openAdModal|closeAdModal|closeAdModalDirect|previewLogo|submitAdForm|submitContact)$'
  }]
};

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '**/*.min.js'
    ]
  },
  {
    files: ['assets/js/**/*.js', 'admin/assets/js/**/*.js', 'data.js', 'shop-data.js', 'sw.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.serviceworker
      }
    },
    rules: sharedRules
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
    rules: sharedRules
  }
];
