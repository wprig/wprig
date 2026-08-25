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

		// Create manifest.json, SPEC.md, and SKILL.md
		await createManifestFile( componentDir, componentInfo, options );
		await createSpecFile( componentDir, componentInfo );
		await createSkillFile( componentDir, componentInfo );

		// Create stub assets referenced by manifest.asset_mapping so the fresh
		// component passes rig:test-component out of the box.
		await createAssetStubs( componentInfo );

		console.log(
			'Component created successfully! Wiring is handled automatically via dynamic loading.'
		);
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
		paradigm: 'all',
	};

	// First non-flag argument is the component name
	const componentNameArg = args.find( ( arg ) => ! arg.startsWith( '--' ) );
	if ( componentNameArg ) {
		options.componentName = componentNameArg;
	}

	// Parse flags
	for ( let i = 0; i < args.length; i++ ) {
		const arg = args[ i ];
		if ( arg === '--templating' ) {
			options.templating = true;
		} else if ( arg === '--tests' ) {
			options.tests = true;
		} else if ( arg === '--paradigm' && args[ i + 1 ] ) {
			options.paradigm = args[ i + 1 ];
			i++; // consume the value
		} else if ( arg.startsWith( '--paradigm=' ) ) {
			options.paradigm = arg.slice( '--paradigm='.length );
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

	const validParadigms = [ 'all', 'classic', 'universal', 'block-based' ];
	if ( ! validParadigms.includes( options.paradigm ) ) {
		console.error(
			`Error: Invalid paradigm "${
				options.paradigm
			}". Valid values: ${ validParadigms.join( ', ' ) }`
		);
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
	const { templating, paradigm } = options;

	// Build the interfaces list
	const interfaces = [ 'Component_Interface' ];
	if ( templating ) {
		interfaces.push( 'Templating_Component_Interface' );
	}

	// Paradigm gating (OCR build contract): non-'all' components declare a
	// PARADIGM const and use Paradigm_Component_Trait so Theme skips them when
	// the active theme type doesn't include that paradigm.
	const gated = paradigm !== 'all';
	const paradigmConst = gated
		? `
	/**
	 * The paradigm tag gating this component (see config/paradigms.json).
	 *
	 * @var string
	 */
	const PARADIGM = '${ paradigm }';
`
		: '';
	const paradigmTraitUse = gated
		? `	use Paradigm_Component_Trait;
`
		: '';

	// Build the use statements
	const useStatements = [ `use WP_Rig\\WP_Rig\\Component_Interface;` ];

	if ( templating ) {
		useStatements.push(
			`use WP_Rig\\WP_Rig\\Templating_Component_Interface;`
		);
	}

	if ( gated ) {
		useStatements.push( `use WP_Rig\\WP_Rig\\Paradigm_Component_Trait;` );
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
${ paradigmTraitUse }${ paradigmConst }
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
 * Create manifest.json file (schema v2 — OCR build contract)
 *
 * @param {string} componentDir  Component directory
 * @param {Object} componentInfo Component information
 * @param {Object} options       Command line options (paradigm)
 */
async function createManifestFile( componentDir, componentInfo, options ) {
	const manifestPath = path.join( componentDir, 'manifest.json' );
	const gated = options.paradigm !== 'all';
	const manifest = {
		slug: componentInfo.kebabSlug,
		version: '1.0.0',
		title: componentInfo.originalName,
		description: `Functional component for ${ componentInfo.originalName }.`,
		// OCR build contract: paradigm must match the component's PARADIGM const
		// (config/paradigms.json). Block-based components are gated out of the
		// classic core and must ship scoped assets.
		paradigm: options.paradigm,
		php_class_mapping: componentInfo.pascalName,
		asset_mapping: {
			styles: [
				{
					src: `assets/css/src/${ componentInfo.kebabSlug }.css`,
					target: `assets/css/src/${ componentInfo.kebabSlug }.css`,
					// Scoped: compiled into the theme pipeline but only enqueued
					// conditionally by the component's PHP.
					scoped: gated,
				},
			],
			scripts: [
				{
					src: `assets/js/src/${ componentInfo.kebabSlug }.ts`,
					target: `assets/js/src/${ componentInfo.kebabSlug }.ts`,
					scoped: gated,
				},
			],
		},
		dependencies: {
			npm: {},
			wp_plugins: {},
		},
		ai_context: {
			spec: 'SPEC.md',
			skill: 'SKILL.md',
		},
	};

	await fs.writeFile( manifestPath, JSON.stringify( manifest, null, '\t' ) );
	console.log( `Created: ${ manifestPath }` );
}

/**
 * Create stub CSS/TS assets referenced by manifest.asset_mapping.
 *
 * @param {Object} componentInfo Component information
 */
async function createAssetStubs( componentInfo ) {
	const { kebabSlug } = componentInfo;

	const cssPath = path.join(
		themeRoot,
		'assets',
		'css',
		'src',
		`${ kebabSlug }.css`
	);
	if ( ! ( await fileExists( cssPath ) ) ) {
		await fs.writeFile( cssPath, `/* Styles for ${ kebabSlug } */\n` );
		console.log( `Created: ${ cssPath }` );
	}

	const jsPath = path.join(
		themeRoot,
		'assets',
		'js',
		'src',
		`${ kebabSlug }.ts`
	);
	if ( ! ( await fileExists( jsPath ) ) ) {
		await fs.writeFile(
			jsPath,
			`// Scripts for ${ kebabSlug }\nexport {};\n`
		);
		console.log( `Created: ${ jsPath }` );
	}
}

/**
 * Create SPEC.md file
 *
 * @param {string} componentDir  Component directory
 * @param {Object} componentInfo Component information
 */
async function createSpecFile( componentDir, componentInfo ) {
	const specPath = path.join( componentDir, 'SPEC.md' );
	const specContent = `# SPEC: ${ componentInfo.originalName }

## Overview
Brief description of what this component does.

## Arguments ($args)
Define any arguments that can be passed to the component if it uses templates.

## Filters
List any filters provided by this component.

## Data Structure
Describe the data structure returned or used by this component.
`;

	await fs.writeFile( specPath, specContent );
	console.log( `Created: ${ specPath }` );
}

/**
 * Create SKILL.md file
 *
 * @param {string} componentDir  Component directory
 * @param {Object} componentInfo Component information
 */
async function createSkillFile( componentDir, componentInfo ) {
	const skillPath = path.join( componentDir, 'SKILL.md' );
	const skillContent = `# SKILL: How to use ${ componentInfo.originalName }

## Implementation Recipe
1. How to instantiate the component (if needed).
2. How to use it in a template.
3. Example code snippet.

\`\`\`php
// Example usage
wp_rig()->${ componentInfo.kebabSlug }_method();
\`\`\`
`;

	await fs.writeFile( skillPath, skillContent );
	console.log( `Created: ${ skillPath }` );
}

/**
 * Wire component in Theme.php or functions.php (Legacy - Now handled by dynamic loading)
 *
 * @param {Object} componentInfo Component information
 */
async function wireComponent( componentInfo ) {
	// No longer needed as Theme.php uses dynamic loading.
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
