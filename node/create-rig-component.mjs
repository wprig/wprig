#!/usr/bin/env node

/**
 * WP Rig Component Scaffolding System
 *
 * This script generates a new component for WP Rig with minimal dependencies.
 * Usage: npm run create-rig-component "Component Name" [options]
 *
 * Options:
 *  --templating         Add Templating_Component_Interface and template_tags() method
 *  --tests              Create minimal PHPUnit test skeleton
 *
 * @package
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '..' );

/**
 * Main function to create a component
 */
async function createRigComponent() {
	try {
		// Parse command line arguments
		const args = process.argv.slice( 2 );
		const options = parseCommandLineArgs( args );

		// Prompt for component name if not provided
		if ( ! options.componentName ) {
			options.componentName = await promptForComponentName();
		}

		// Validate options
		validateOptions( options );

		// Generate component info
		const componentInfo = processComponentName( options.componentName );
		console.log( `Creating component: ${ componentInfo.pascalName }` );
		console.log( `  Slug: ${ componentInfo.kebabSlug }` );
		console.log( `  Directory: inc/${ componentInfo.pascalName }/` );
		console.log(
			`  Namespace: WP_Rig\\WP_Rig\\${ componentInfo.pascalName }`
		);

		// Create directories
		const componentDir = path.join(
			themeRoot,
			'inc',
			componentInfo.pascalName
		);
		await createDirectoryIfNotExists( componentDir );

		// Check if Component.php already exists
		const componentFilePath = path.join( componentDir, 'Component.php' );
		if ( await fileExists( componentFilePath ) ) {
			console.error(
				`Error: Component.php already exists at ${ componentFilePath }`
			);
			process.exit( 1 );
		}

		// Create Component.php
		await createComponentFile( componentFilePath, componentInfo, options );
		console.log( `Created: ${ componentFilePath }` );

		// Create test file if requested
		if ( options.tests ) {
			await createTestFile( componentInfo );
		}

		// Always auto-wire the component
		await wireComponent( componentInfo );

		console.log( 'Component created successfully!' );
	} catch ( error ) {
		console.error( 'Error creating component:', error.message );
		process.exit( 1 );
	}
}

/**
 * Parse command line arguments
 *
 * @param {Array} args Command line arguments
 * @return {Object} Parsed options
 */
function parseCommandLineArgs( args ) {
	const options = {
		componentName: null,
		templating: false,
		tests: false,
	};

	// First non-flag argument is the component name
	const componentNameArg = args.find( ( arg ) => ! arg.startsWith( '--' ) );
	if ( componentNameArg ) {
		options.componentName = componentNameArg;
	}

	// Parse flags
	for ( const arg of args ) {
		if ( arg === '--templating' ) {
			options.templating = true;
		} else if ( arg === '--tests' ) {
			options.tests = true;
		}
	}

	return options;
}

/**
 * Prompt for component name if not provided in arguments
 *
 * @return {Promise<string>} Component name
 */
function promptForComponentName() {
	const rl = readline.createInterface( {
		input: process.stdin,
		output: process.stdout,
	} );

	return new Promise( ( resolve ) => {
		rl.question( 'Enter component name: ', ( answer ) => {
			rl.close();
			resolve( answer.trim() );
		} );
	} );
}

/**
 * Validate command line options
 *
 * @param {Object} options Parsed options
 */
function validateOptions( options ) {
	if ( ! options.componentName ) {
		console.error( 'Error: Component name is required' );
		process.exit( 1 );
	}
}

/**
 * Process component name into various formats
 *
 * @param {string} name Raw component name
 * @return {Object} Processed name information
 */
function processComponentName( name ) {
	// Remove any non-alphanumeric characters and spaces
	const cleanName = name.replace( /[^\w\s]/g, '' );

	// Convert to Pascal_Case (with underscores)
	const pascalName = cleanName
		.split( /\s+/ )
		.map( ( word ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( '_' );

	// Convert to kebab-case
	const kebabSlug = cleanName.toLowerCase().replace( /\s+/g, '-' );

	return {
		originalName: name,
		pascalName,
		kebabSlug,
	};
}

/**
 * Create directory if it doesn't exist
 *
 * @param {string} dir Directory path
 */
async function createDirectoryIfNotExists( dir ) {
	try {
		await fs.access( dir );
	} catch ( error ) {
		await fs.mkdir( dir, { recursive: true } );
	}
}

/**
 * Check if a file exists
 *
 * @param {string} filePath File path
 * @return {Promise<boolean>} True if file exists
 */
async function fileExists( filePath ) {
	try {
		await fs.access( filePath );
		return true;
	} catch ( error ) {
		return false;
	}
}

/**
 * Create Component.php file
 *
 * @param {string} filePath      File path
 * @param {Object} componentInfo Component information
 * @param {Object} options       Command line options
 */
async function createComponentFile( filePath, componentInfo, options ) {
	const { pascalName, kebabSlug } = componentInfo;
	const { templating } = options;

	// Build the interfaces list
	const interfaces = [ 'Component_Interface' ];
	if ( templating ) {
		interfaces.push( 'Templating_Component_Interface' );
	}

	// Build the use statements
	const useStatements = [ `use WP_Rig\\WP_Rig\\Component_Interface;` ];

	if ( templating ) {
		useStatements.push(
			`use WP_Rig\\WP_Rig\\Templating_Component_Interface;`
		);
	}

	useStatements.push( `use function add_action;` );
	useStatements.push( `use function add_filter;` );

	// Build a basic initialize method
	const initializeMethod = `
	/**
	 * Adds the action and filter hooks to integrate with WordPress.
	 */
	public function initialize() {
		// Add hooks here.
	}`;

	// Build the template_tags method
	let templateTagsMethod = '';

	if ( templating ) {
		templateTagsMethod = `
	/**
	 * Gets template tags to expose as methods on the Template_Tags class instance, accessible through \`wp_rig()\`.
	 *
	 * @return array Associative array of $method_name => $callback_info pairs. Each $callback_info must either be
	 *               a callable or an array with key 'callable'. This approach is used to reserve the possibility of
	 *               adding support for further arguments in the future.
	 */
	public function template_tags(): array {
		return [
			// Add template tags here.
		];
	}`;
	}

	// Define empty hookMethods variable
	const hookMethods = '';

	// Combine everything into the full component template
	const componentTemplate = `<?php
/**
 * WP_Rig\\WP_Rig\\${ pascalName } Component
 *
 * @package wp_rig
 */

namespace WP_Rig\\WP_Rig\\${ pascalName };

${ useStatements.join( '\n' ) }

/**
 * Class for ${ componentInfo.originalName } component.
 */
class Component implements ${ interfaces.join( ', ' ) } {

	/**
	 * Gets the unique identifier for the theme component.
	 *
	 * @return string Component slug.
	 */
	public function get_slug(): string {
		return '${ kebabSlug }';
	}
${ initializeMethod }${ templateTagsMethod }${ hookMethods }
}
`;

	await fs.writeFile( filePath, componentTemplate );
}

/**
 * Create PHPUnit test file
 *
 * @param {Object} componentInfo Component information
 */
async function createTestFile( componentInfo ) {
	const { pascalName, kebabSlug } = componentInfo;
	const testDir = path.join(
		themeRoot,
		'tests',
		'phpunit',
		'unit',
		'inc',
		pascalName
	);
	await createDirectoryIfNotExists( testDir );

	const testFilePath = path.join( testDir, 'ComponentTest.php' );

	const testTemplate = `<?php
/**
 * WP_Rig\\WP_Rig\\Tests\\Unit\\${ pascalName } ComponentTest
 *
 * @package wp_rig
 */

namespace WP_Rig\\WP_Rig\\Tests\\Unit\\${ pascalName };

use WP_Rig\\WP_Rig\\${ pascalName }\\Component;
use PHPUnit\\Framework\\TestCase;

/**
 * Class for testing ${ pascalName } component.
 */
class ComponentTest extends TestCase {

	/**
	 * Test get_slug method.
	 */
	public function test_get_slug() {
		$component = new Component();
		$this->assertEquals('${ kebabSlug }', $component->get_slug());
	}
}
`;

	await fs.writeFile( testFilePath, testTemplate );
	console.log( `Created: ${ testFilePath }` );
}

/**
 * Create template part file
 *
 * @param {Object} componentInfo Component information
 */
async function createTemplatePartFile( componentInfo ) {
	const { kebabSlug } = componentInfo;
	const templatePartDir = path.join( themeRoot, 'template-parts', kebabSlug );
	await createDirectoryIfNotExists( templatePartDir );

	const templatePartPath = path.join( templatePartDir, 'content.php' );

	const templatePartContent = `<?php
/**
 * Template part for ${ componentInfo.originalName }
 *
 * @package wp_rig
 */

namespace WP_Rig\\WP_Rig;

?>
<div class="${ kebabSlug }-wrapper">
	<!-- ${ componentInfo.originalName } content goes here -->
</div>
`;

	await fs.writeFile( templatePartPath, templatePartContent );
	console.log( `Created: ${ templatePartPath }` );
}

/**
 * Wire component in Theme.php or functions.php
 *
 * @param {Object} componentInfo Component information
 */
async function wireComponent( componentInfo ) {
	try {
		// First try to wire in Theme.php
		const themePath = path.join( themeRoot, 'inc', 'Theme.php' );
		const themeContent = await fs.readFile( themePath, 'utf8' );

		// Look for the components array in get_default_components method
		// Match the pattern where components are assigned to a variable
		const componentsArrayRegex =
			/protected function get_default_components\(\): array \{[\s\S]*?\$components = array\(([\s\S]*?)\);/;
		const match = themeContent.match( componentsArrayRegex );

		if ( match ) {
			// Find the position to insert the new component
			const componentsArray = match[ 1 ];

			// Find all component entries in the array
			const componentEntries = componentsArray.match(
				/new [A-Za-z_\\]+\\Component\(\)/g
			);

			if ( componentEntries && componentEntries.length > 0 ) {
				// Get the last component in the main array
				const lastComponent =
					componentEntries[ componentEntries.length - 1 ];
				const lastComponentPos =
					componentsArray.lastIndexOf( lastComponent );

				if ( lastComponentPos !== -1 ) {
					// Find the end of the last component line (including the comma)
					const endOfLinePos = componentsArray.indexOf(
						',',
						lastComponentPos
					);

					if ( endOfLinePos !== -1 ) {
						// Calculate the position to insert the new component
						const insertPos =
							match.index +
							match[ 0 ].indexOf( componentsArray ) +
							endOfLinePos +
							1;

						// Create the new component line with proper indentation
						const newComponentLine = `\n\t\t\tnew ${ componentInfo.pascalName }\\Component(),`;

						// Insert the new component after the last component
						const newContent =
							themeContent.slice( 0, insertPos ) +
							newComponentLine +
							themeContent.slice( insertPos );

						await fs.writeFile( themePath, newContent );
						console.log( `Component wired in: ${ themePath }` );
						return;
					}
				}
			}
		}

		// If Theme.php wiring failed, try functions.php
		const functionsPath = path.join( themeRoot, 'inc', 'functions.php' );
		if ( await fileExists( functionsPath ) ) {
			const functionsContent = await fs.readFile( functionsPath, 'utf8' );

			// Look for register_components or similar function call with array
			const registerComponentsRegex =
				/(register_components\s*\()\s*array\(([\s\S]*?)\)([\s\S]*?\));/;
			const functionsMatch = functionsContent.match(
				registerComponentsRegex
			);

			if ( functionsMatch ) {
				const componentsArray = functionsMatch[ 2 ];
				const lastComponentPos = componentsArray.lastIndexOf( 'new ' );

				if ( lastComponentPos !== -1 ) {
					// Find the end of the last component
					const endOfLinePos = componentsArray.indexOf(
						',',
						lastComponentPos
					);

					if ( endOfLinePos !== -1 ) {
						// Insert the new component
						const newComponentLine = `\n\t\tnew ${ componentInfo.pascalName }\\Component(),`;
						const newContent =
							functionsContent.slice(
								0,
								functionsMatch.index +
									functionsMatch[ 1 ].length +
									endOfLinePos +
									1
							) +
							newComponentLine +
							functionsContent.slice(
								functionsMatch.index +
									functionsMatch[ 1 ].length +
									endOfLinePos +
									1
							);

						await fs.writeFile( functionsPath, newContent );
						console.log( `Component wired in: ${ functionsPath }` );
						return;
					}
				}
			}
		}

		// If we got here, auto-wiring failed
		console.warn(
			`Couldn't auto-wire the component. Please add manually:`
		);
		console.warn( `new ${ componentInfo.pascalName }\\Component(),` );
		console.warn(
			`to the components array in inc/Theme.php or inc/functions.php`
		);
	} catch ( error ) {
		console.warn(
			`Warning: Failed to auto-wire component: ${ error.message }`
		);
		console.warn(
			`Please add the component manually to Theme.php or functions.php`
		);
	}
}

/**
 * Helper function to capitalize the first letter of a string
 *
 * @param {string} string String to capitalize
 * @return {string} Capitalized string
 */
function capitalizeFirstLetter( string ) {
	return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
}

// Execute the script
createRigComponent();
