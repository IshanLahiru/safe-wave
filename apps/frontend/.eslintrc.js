module.exports = {
  extends: ['expo', 'prettier'],
  rules: {
    // General code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // React/React Native rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'build/', '*.config.js'],
};
