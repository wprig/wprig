// eslint.config.js

// SOLUTION 1: Using FlatCompat (recommended since @wordpress/eslint-plugin doesn't have native Flat Config yet)
import { FlatCompat } from '@eslint/eslintrc';
import babelParser from '@babel/eslint-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Global ignores (alternative to .eslintignore)
  {
    ignores: [
      'assets/js/libs/**',
      'node_modules/**',
      'vendor/**',
      'config/**',
      'gulpfile.babel.js', // Parsing error: 'import' and 'export' may appear only with 'sourceType: module'
      '**/*.min.{js,ts,jsx,tsx}', // All minified files
    ],
  },

  // Convert WordPress recommended configuration
  ...compat.extends('plugin:@wordpress/eslint-plugin/recommended'),

  // Configuration files: explicitly allow devDependencies
  {
    files: ['eslint.config.js', 'webpack.config.js', '*.config.js', 'gulpfile.js'],
    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            'eslint.config.js',
            'webpack.config.js',
            '*.config.js',
            'gulpfile.js',
          ],
        },
      ],
    },
  },

  // JSX-specific configuration - MUST come AFTER WordPress config to override it
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      globals: {
        wp: 'readonly',
        wpRigScreenReaderText: 'readonly',
        jQuery: 'readonly',
        $: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Override WordPress rules for JSX
      'no-console': 'warn',
      'prettier/prettier': 'off', // Disable Prettier completely
      'react/jsx-filename-extension': ['warn', { extensions: ['.js', '.jsx'] }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // TypeScript-specific configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Relax JSDoc rules for TypeScript
      'jsdoc/no-undefined-types': 'off', // TypeScript types are often not defined in JSDoc
    },
  },

  // JavaScript files (without JSX) - MUST come AFTER WordPress config to override
  {
    files: ['**/*.js'],
    rules: {
      // Allow console for development, but warn
      'no-console': 'warn', // instead of 'error'
      // WordPress Coding Standards formatting rules
      'array-bracket-spacing': ['error', 'always'],
      'comma-spacing': ['error', { before: false, after: true }],
      'object-curly-spacing': ['error', 'always'],
      'space-in-parens': ['error', 'always'],
      // Override WordPress Prettier integration
      'prettier/prettier': 'off',
    },
  },
];
