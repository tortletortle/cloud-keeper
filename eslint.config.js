const browserGlobals = Object.fromEntries([
  'window', 'document', 'navigator', 'localStorage', 'sessionStorage',
  'location', 'history', 'screen', 'matchMedia', 'getComputedStyle',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
  'cancelIdleCallback', 'alert', 'confirm', 'prompt', 'Image', 'Audio',
  'Blob', 'URL', 'File', 'FileReader', 'FileList', 'HTMLElement', 'Element',
  'Node', 'Event', 'CustomEvent', 'PointerEvent', 'MouseEvent',
  'KeyboardEvent', 'TouchEvent', 'DOMException', 'MutationObserver',
  'ResizeObserver', 'IntersectionObserver', 'TextEncoder', 'TextDecoder',
  'crypto', 'performance', 'fetch', 'Headers', 'Request', 'Response',
  'AbortController', 'FormData', 'URLSearchParams', 'atob', 'btoa',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'console', 'globalThis'
].map((name) => [name, 'readonly']));

const nodeGlobals = Object.fromEntries([
  'require', 'module', 'exports', '__dirname', '__filename',
  'process', 'Buffer', 'setImmediate', 'clearImmediate'
].map((name) => [name, 'readonly']));

module.exports = [
  {
    ignores: ['dist/**', '.eslint-tmp/**', 'node_modules/**']
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...browserGlobals, ...nodeGlobals }
    },
    rules: {
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-dupe-else-if': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-cond-assign': ['error', 'always'],
      'no-debugger': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-ex-assign': 'error',
      'no-func-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-prototype-builtins': 'error',
      'no-sparse-arrays': 'error',
      'no-unexpected-multiline': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-throw-literal': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'curly': ['warn', 'multi-line'],
      'no-unused-vars': ['warn', {
        args: 'none',
        caughtErrors: 'none',
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      'prefer-const': 'warn',
      'no-trailing-spaces': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 2 }],
      'no-alert': 'warn',
      'no-console': 'off'
    }
  }
];
