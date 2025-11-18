module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: ['react-app', 'react-app/jest'],
  rules: {
    'prefer-const': 'error',
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
  ignorePatterns: ['build/**', 'node_modules/**'],
};
