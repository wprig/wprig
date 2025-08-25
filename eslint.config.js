// eslint.config.js

// Using FlatCompat to convert @wordpress/eslint-plugin to flat config format
import { FlatCompat } from '@eslint/eslintrc';
import babelParser from '@babel/eslint-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const compat = new FlatCompat( {
	baseDirectory: __dirname,
} );

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
	...compat.extends( 'plugin:@wordpress/eslint-plugin/recommended' ),

	// Configuration files: explicitly allow devDependencies
	{
		files: [
			'eslint.config.js',
			'webpack.config.js',
			'*.config.js',
			'gulpfile.js',
		],
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
		files: [ '**/*.jsx' ],
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
					presets: [ '@babel/preset-react' ],
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
	},

	// TypeScript-specific configuration
	{
		files: [ '**/*.ts', '**/*.tsx' ],
		rules: {
			// Relax JSDoc rules for TypeScript
			'jsdoc/no-undefined-types': 'off', // TypeScript types are often not defined in JSDoc
		},
	},

	// Console rule for all JavaScript/TypeScript files
	{
		files: [ '**/*.{js,ts,jsx,tsx}' ],
		rules: {
			// Allow console for development, but warn
			'no-console': 'warn', // You can set it to 'error' if you like.
		},
	},
];
