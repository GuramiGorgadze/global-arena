import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: eslintPluginPrettier // prettier plugin
    },
    rules: {
      'no-console': 'warn', // Warn on console.* usage (debug leftovers)
      'no-debugger': 'error', // Error on debugger statements
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }], // Error on unused vars/args unless prefixed
      'no-duplicate-imports': 'error', // Disallow importing the same file multiple times
      eqeqeq: ['error', 'always'], // Enforce strict ===/!== instead of loose equality
      curly: ['error', 'all'], // Require {} around all control blocks
      'prefer-const': 'error', // Use const for variables that are never reassigned
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }], // Warn if file exports non-component values
      'no-return-await': 'error', // Avoid unnecessary await in return
      'no-implicit-coercion': 'warn', // Discourage using !!, +var, etc. for type coercion
      'no-empty-function': 'warn', // Avoid functions with no logic
      'no-var': 'error', // Encourage let/const over var
      'no-new': 'error', // Prevent useless object instantiation like `new Object()`
      'no-shadow': 'warn', // Prevent variable declarations from shadowing variables in outer scopes
      'prefer-template': 'error', // Enforce template literals over string concatenation
      // 'no-use-before-define': ['error', { functions: false, classes: true }], // Prevent usage of variables before declaration

      // Prettier-related  
      'prettier/prettier': 'error', // Treat Prettier formatting issues as errors
    },
  },
  prettier, // disables ESLint rules that conflict with Prettier
]