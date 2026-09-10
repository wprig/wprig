#!/usr/bin/env node
/**
 * WP Rig Component Registry CLI
 */

import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import inquirer from 'inquirer';

// Internal dependencies
import { logger, toPascalCase } from './lib/rig-utils.js';
import listComponents from './tasks/listComponents.js';
import searchComponents from './tasks/searchComponents.js';
import downloadComponent from './tasks/downloadComponent.js';
import removeComponent from './tasks/removeComponent.js';
import prepareComponent from './tasks/prepareComponent.js';
import testComponent from './tasks/testComponent.js';
import scaffoldPattern from './tasks/scaffoldPattern.js';
import localizeAssets from './tasks/localizeAssets.js';
import screenshotCompare from './tasks/screenshotCompare.js';
import promoteVersion from './tasks/promoteVersion.js';
import { bakeSync } from './tasks/bakeSync.js';

// Setup paths
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const themeRoot = path.resolve( __dirname, '..' );

const program = new Command();

/**
 * CLI Configuration
 */
program
	.name( 'rig' )
	.description( 'WP Rig Component Registry CLI' )
	.version( '1.0.0' )
	.option( '-r, --registry <name>', 'Registry to use', 'default' )
	.option( '-y, --yes', 'Automatically answer "yes" to all prompts', false )
	.option( '--force', 'Bypass all caches', false );

/**
 * Command: list
 */
program
	.command( 'list' )
	.description( 'List all installed theme components' )
	.action( async () => {
		await listComponents( themeRoot );
	} );

/**
 * Command: search
 */
program
	.command( 'search [keyword]' )
	.description( 'Search for components in the registry' )
	.action( async ( keyword ) => {
		await searchComponents( keyword, program.opts() );
	} );

/**
 * Command: add
 */
program
	.command( 'add <slug>' )
	.description( 'Add a component from the registry' )
	.action( async ( slug ) => {
		await downloadComponent( slug, themeRoot, program.opts() );
	} );

/**
 * Command: update
 */
program
	.command( 'update <slug>' )
	.description( 'Update a component from the registry' )
	.action( async ( slug ) => {
		await downloadComponent( slug, themeRoot, {
			...program.opts(),
			isUpdate: true,
		} );
	} );

/**
 * Command: remove
 */
program
	.command( 'remove <slug>' )
	.description( 'Remove a component and its assets' )
	.action( async ( slug ) => {
		await removeComponent( slug, themeRoot );
	} );

/**
 * Command: prepare
 */
program
	.command( 'prepare <slug>' )
	.description(
		'Prepare a component for submission by packaging it into a folder.'
	)
	.action( async ( slug ) => {
		await prepareComponent( slug, themeRoot );
	} );

/**
 * Command: test-component
 */
program
	.command( 'test-component [slug]' )
	.description( 'Validate a component for registry readiness' )
	.action( async ( slug ) => {
		let componentSlug = slug;
		if ( ! componentSlug ) {
			const answers = await inquirer.prompt( [
				{
					type: 'input',
					name: 'slug',
					message: 'Enter the component slug (folder name in inc/):',
					validate: ( input ) =>
						input ? true : 'Slug is required',
				},
			] );
			componentSlug = answers.slug;
		}

		const normalizedSlug = toPascalCase( componentSlug );
		const checkPath = path.join( themeRoot, 'inc', normalizedSlug );

		if ( await fs.pathExists( checkPath ) ) {
			await testComponent( themeRoot, normalizedSlug );
		} else {
			await testComponent( themeRoot, componentSlug );
		}
	} );

/**
 * Command: pattern
 */
program
	.command( 'pattern' )
	.description( 'Scaffold a new Block Pattern' )
	.option( '--title <title>', 'Pattern title' )
	.option( '--slug <slug>', 'Pattern slug (raw, without theme prefix)' )
	.option(
		'--categories <categories>',
		'Comma-separated categories',
		'featured'
	)
	.option( '--description <description>', 'Pattern description' )
	.option( '--keywords <keywords>', 'Comma-separated keywords' )
	.action( async ( opts ) => {
		let patternOpts = opts;
		if ( ! patternOpts.title ) {
			const answers = await inquirer.prompt( [
				{
					type: 'input',
					name: 'title',
					message: 'Enter the pattern title:',
					validate: ( input ) =>
						input ? true : 'Title is required',
				},
				{
					type: 'input',
					name: 'categories',
					message: 'Enter pattern categories (comma-separated):',
					default: 'featured',
				},
			] );
			patternOpts = { ...patternOpts, ...answers };
		}
		await scaffoldPattern( themeRoot, patternOpts );
	} );

/**
 * Command: localize
 */
program
	.command( 'localize' )
	.description(
		'Scan the theme for external image URLs and localize them to assets/images/.'
	)
	.action( async () => {
		await localizeAssets( themeRoot );
	} );

/**
 * Command: compare
 */
program
	.command( 'compare' )
	.description(
		'Compare the live site against a mockup image for visual fidelity.'
	)
	.option( '--url <url>', 'URL of the live site', 'http://wprig.test:8888' )
	.option( '--mockup <path>', 'Path to the mockup image' )
	.option( '--output <path>', 'Path to save comparison results' )
	.option( '--no-full-page', 'Do not take a full page screenshot' )
	.action( async ( opts ) => {
		await screenshotCompare( themeRoot, {
			url: opts.url,
			mockupPath: opts.mockup,
			outputPath: opts.output,
			fullPage: opts.fullPage,
		} );
	} );

/**
 * Command: check
 */
program
	.command( 'check [slug]' )
	.description( 'Validate local component structure and manifest' )
	.action( async ( slug ) => {
		const incDir = path.join( themeRoot, 'inc' );
		let directories = [];

		if ( slug ) {
			const normalizedSlug = toPascalCase( slug );
			if ( await fs.pathExists( path.join( incDir, normalizedSlug ) ) ) {
				directories.push( normalizedSlug );
			} else if ( await fs.pathExists( path.join( incDir, slug ) ) ) {
				directories.push( slug );
			} else {
				logger.error( `Component "${ slug }" not found in inc/` );
				return;
			}
		} else {
			directories = (
				await fs.readdir( incDir, { withFileTypes: true } )
			)
				.filter( ( dirent ) => dirent.isDirectory() )
				.map( ( dirent ) => dirent.name );
		}

		logger.info( `Checking ${ directories.length } component(s)...` );

		let totalErrors = 0;
		for ( const dir of directories ) {
			const success = await testComponent( themeRoot, dir );
			if ( ! success ) {
				totalErrors++;
			}
		}

		if ( totalErrors === 0 ) {
			logger.success( '\n✓ All components passed validation.' );
		} else {
			logger.error(
				`\n✗ ${ totalErrors } component(s) failed validation.`
			);
		}
	} );

/**
 * Command: bake
 *
 * Site Editor bake & sync (vendored wp-theme-control wrapper). Everything
 * after the scope is passed through to the vendored Bash scripts untouched,
 * including upstream WP-CLI args (--path/--url/--user/--state-dir/--dry-run/
 * --clean/--force). The paradigm gate and WP-root resolution live in the
 * task module (SPEC-015 §5.1).
 */
program
	.command( 'bake [scope]' )
	.description(
		'Bake Site Editor changes (patterns, templates, fonts, Global Styles) into the theme'
	)
	.allowUnknownOption( true )
	.action( async ( scope ) => {
		const bakeIndex = process.argv.lastIndexOf( 'bake' );
		const passthrough = process.argv
			.slice( bakeIndex + 1 )
			.filter( ( arg ) => arg !== scope && arg !== '--' );
		const code = await bakeSync( scope || 'all', { passthrough } );
		if ( code !== 0 ) {
			process.exitCode = code;
		}
	} );

/**
 * Command: version
 */
program
	.command( 'version <newVersion>' )
	.description( 'Promote the theme version across all relevant files' )
	.option( '-d, --description <description>', 'Changelog description' )
	.action( async ( newVersion, opts ) => {
		try {
			await promoteVersion( themeRoot, newVersion, opts );
		} catch ( e ) {
			logger.error( e.message );
			process.exit( 1 );
		}
	} );

program.parse();
