module.exports = {
	root: true, // Ensure this is the root configuration.
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended', // WordPress recommended rules.
		'plugin:react/recommended', // React-specific linting rules.
		'plugin:jsx-a11y/recommended', // Accessibility checks for JSX.
	],
	env: {
		browser: true, // For client-side JavaScript files.
		node: true, // For server-side or build scripts.
		es6: true, // Enables ES6 syntax.
	},
	globals: {
		jQuery: 'readonly',
		wp: 'readonly',
	},
	parser: '@typescript-eslint/parser', // Use TypeScript parser, even for JSX.
	parserOptions: {
		ecmaVersion: 2020, // Allows modern ECMAScript syntax.
		sourceType: 'module', // Enables the use of import/export statements.
		ecmaFeatures: {
			jsx: true, // Enables JSX syntax.
		},
	},
	settings: {
		react: {
			version: 'detect', // Automatically detect the React version.
		},
	},
	plugins: [
		'react', // React linting.
		'jsx-a11y', // Accessibility rules for JSX.
		'react-hooks', // Linting for React hooks.
	],
	rules: {
		// Example of custom rule configuration.
		'no-console': 'warn', // Flag usage of console.log with warnings, not errors.
		'react/react-in-jsx-scope': 'off', // Not needed with React 17 and newer.
		'react/prop-types': 'off', // Disable prop-types rule if using TypeScript or not needed.
	},
	overrides: [
		{
			files: ['gulp/**/*.js', 'node/**/*.js', '*.js'],
			env: {
				node: true, // Node-specific files.
			},
			rules: {
				'no-console': 'off', // Allow console logging in Node.js scripts.
			},
		},
		{
			files: ['assets/js/**/*.js'],
			env: {
				browser: true, // Browser JavaScript files.
			},
			rules: {
				'no-console': 'error', // Disallow console logging in production code.
			},
		},
	],
};
