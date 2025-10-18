#!/usr/bin/env node
/**
 * Convert WP Rig Base_Support component to strictly block-based (FSE) setup.
 *
 * Features:
 * - Removes classic-only hooks from initialize().
 * - Removes classic-only method implementations.
 * - Removes selected add_theme_support() lines.
 * - Optional: prune HTML5 support block.
 * - Optional: drop title-tag support method and its init hook.
 * - Idempotent: safe to run multiple times.
 * - Dry-run supported via --dry-run.
 * - Creates a .bak backup of the target file on first write.
 *
 * ESM script (package.json has "type":"module"). Node >= 20.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const THEME_ROOT = process.cwd();
const TARGET_REL = 'inc/Base_Support/Component.php';
const TARGET = path.resolve( THEME_ROOT, TARGET_REL );

function parseArgs( argv ) {
	const flags = new Set();
	for ( const arg of argv.slice( 2 ) ) {
		if (
			arg === '--dry-run' ||
			arg === '--prune-html5' ||
			arg === '--drop-title-tag'
		) {
			flags.add( arg );
		}
	}
	return {
		dryRun: flags.has( '--dry-run' ),
		pruneHtml5: flags.has( '--prune-html5' ),
		dropTitleTag: flags.has( '--drop-title-tag' ),
	};
}

// More robust balanced end finder that skips strings and comments.
// Returns index AFTER the matching close character, or -1 if not found.
function findBalancedEndSkippingLiterals(
	source,
	openIndex,
	openChar = '{',
	closeChar = '}'
) {
	let i = openIndex;
	const len = source.length;

	// Ensure we start at the given openChar
	if ( source[ i ] !== openChar ) {
		i = source.indexOf( openChar, openIndex );
		if ( i === -1 ) {
			return -1;
		}
	}

	let depth = 1;
	i++; // start scanning after the opening char

	let inSingle = false;
	let inDouble = false;
	let inLineComment = false;
	let inBlockComment = false;

	while ( i < len ) {
		const ch = source[ i ];
		const next = i + 1 < len ? source[ i + 1 ] : '';

		if ( inLineComment ) {
			if ( ch === '\n' ) {
				inLineComment = false;
			}
			i++;
			continue;
		}
		if ( inBlockComment ) {
			if ( ch === '*' && next === '/' ) {
				inBlockComment = false;
				i += 2;
			} else {
				i++;
			}
			continue;
		}
		if ( inSingle ) {
			if ( ch === '\\' ) {
				i += 2; // skip escaped char
				continue;
			}
			if ( ch === "'" ) {
				inSingle = false;
			}
			i++;
			continue;
		}
		if ( inDouble ) {
			if ( ch === '\\' ) {
				i += 2;
				continue;
			}
			if ( ch === '"' ) {
				inDouble = false;
			}
			i++;
			continue;
		}

		// Not in any literal/comment
		if ( ch === "'" ) {
			inSingle = true;
			i++;
			continue;
		}
		if ( ch === '"' ) {
			inDouble = true;
			i++;
			continue;
		}
		if ( ch === '/' && next === '/' ) {
			inLineComment = true;
			i += 2;
			continue;
		}
		if ( ch === '/' && next === '*' ) {
			inBlockComment = true;
			i += 2;
			continue;
		}
		if ( ch === '#' ) {
			inLineComment = true;
			i++;
			continue;
		}

		if ( ch === openChar ) {
			depth++;
			i++;
			continue;
		}
		if ( ch === closeChar ) {
			depth--;
			i++;
			if ( depth === 0 ) {
				return i;
			}
			continue;
		}
		i++;
	}
	return -1;
}

function removeInitializeHooks( source, hookMethodNames ) {
	const result = { source, removed: [] };

	// Locate initialize() body
	const initFnMatch = /function\s+initialize\s*\(\)\s*\{/m.exec( source );
	if ( ! initFnMatch ) {
		return result;
	} // nothing to do
	const initStartBrace =
		initFnMatch.index + initFnMatch[ 0 ].lastIndexOf( '{' );

	// Find end of initialize using safe scanning (skip strings/comments)
	const initEnd = findBalancedEndSkippingLiterals(
		source,
		initStartBrace,
		'{',
		'}'
	);
	if ( initEnd === -1 ) {
		// Could not safely locate method boundary; abort modifications to avoid corruption
		return result;
	}

	const before = source.slice( 0, initStartBrace + 1 );
	const body = source.slice( initStartBrace + 1, initEnd - 1 );
	const after = source.slice( initEnd - 1 );

	const lines = body.split( /\n/ );
	const toRemove = new Set( hookMethodNames );

	const removedNames = new Set();
	const keptLines = [];
	for ( const line of lines ) {
		const trimmed = line.trim();
		let removed = false;
		// Only target full add_action/add_filter lines that reference array( $this, 'method' )
		for ( const name of toRemove ) {
			// Accept variations in spacing and quoting
			const re = new RegExp(
				String.raw`^(?:add_action|add_filter)\s*\([^;]*array\s*\(\s*\$this\s*,\s*['\"]${ name }['\"]\s*\)[^;]*\);\s*$`
			);
			if ( re.test( trimmed ) ) {
				removed = true;
				removedNames.add( name );
				break;
			}
		}
		if ( ! removed ) {
			keptLines.push( line );
		}
	}

	if ( removedNames.size > 0 ) {
		result.source = before + keptLines.join( '\n' ) + after;
		result.removed = Array.from( removedNames );
	}
	return result;
}

function removeMethodOnce( source, methodName ) {
	// Step 1: find the function definition line reliably (anchored to line start)
	const funcRegex = new RegExp(
		String.raw`^\s*public\s+function\s+${ methodName }\s*\([^)]*\)\s*(?::[^\{]*)?\{`,
		'm'
	);
	const funcMatch = funcRegex.exec( source );
	if ( ! funcMatch ) {
		return { source, removed: false };
	}

	let startIndex = funcMatch.index; // default to the function line

	// Step 2: if there's an immediately-adjacent docblock above, include it
	// Find the end of a potential docblock just before the function start
	const beforeFunc = source.slice( 0, startIndex );
	const endComment = beforeFunc.lastIndexOf( '*/' );
	if ( endComment !== -1 ) {
		// Ensure only whitespace exists between the comment end and the function start
		const afterEnd = endComment + 2;
		const between = beforeFunc.slice( afterEnd );
		if ( /^\s*$/.test( between ) ) {
			// Locate the opening of the same docblock
			const startComment = beforeFunc.lastIndexOf( '/**', endComment );
			if ( startComment !== -1 ) {
				startIndex = startComment;
			}
		}
	}

	// Step 3: compute the end index of the function body safely
	const bodyStart = funcMatch.index + funcMatch[ 0 ].lastIndexOf( '{' );
	const endIndex = findBalancedEndSkippingLiterals(
		source,
		bodyStart,
		'{',
		'}'
	);
	if ( endIndex === -1 ) {
		// Safety: if we can't find a reliable end, don't modify the file
		return { source, removed: false };
	}

	// Remove trailing newline(s)
	let j = endIndex;
	while (
		j < source.length &&
		( source[ j ] === '\n' || source[ j ] === '\r' )
	) {
		j++;
	}

	const newSource = source.slice( 0, startIndex ) + source.slice( j );
	return { source: newSource, removed: true };
}

function removeMethods( source, methodNames ) {
	const removed = [];
	let current = source;
	for ( const name of methodNames ) {
		const res = removeMethodOnce( current, name );
		if ( res.removed ) {
			removed.push( name );
		}
		current = res.source;
	}
	return { source: current, removed };
}

function removeThemeSupportLines( source, supportKeys ) {
	// Target only inside action_essential_theme_support() to avoid accidental removals
	const fnMatch =
		/function\s+action_essential_theme_support\s*\(\)\s*\{/m.exec( source );
	if ( ! fnMatch ) {
		return { source, removed: [] };
	}
	const startBrace = fnMatch.index + fnMatch[ 0 ].lastIndexOf( '{' );
	const endPos = findBalancedEndSkippingLiterals(
		source,
		startBrace,
		'{',
		'}'
	);
	if ( endPos === -1 ) {
		return { source, removed: [] };
	}

	const body = source.slice( startBrace + 1, endPos - 1 );

	const removed = [];
	let bodyUpdated = body;
	for ( const key of supportKeys ) {
		const re = new RegExp(
			String.raw`^\s*add_theme_support\s*\(\s*['\"]${ key }['\"]\s*\)\s*;\s*$`,
			'm'
		);
		if ( re.test( bodyUpdated ) ) {
			bodyUpdated = bodyUpdated.replace( re, '' );
			removed.push( key );
		}
	}
	if ( removed.length === 0 ) {
		return { source, removed };
	}

	const before = source.slice( 0, startBrace + 1 );
	const after = source.slice( endPos - 1 );
	// collapse excess blank lines introduced
	bodyUpdated = bodyUpdated.replace( /\n{3,}/g, '\n\n' );
	const updatedSource = before + bodyUpdated + after;
	return { source: updatedSource, removed };
}

function optionallyRemoveHtml5Support( source, enabled ) {
	if ( ! enabled ) {
		return { source, removed: false };
	}
	// Find add_theme_support('html5', ...);
	const callStart = source.search(
		/add_theme_support\s*\(\s*['\"]html5['\"]/m
	);
	if ( callStart === -1 ) {
		return { source, removed: false };
	}
	const parenOpen = source.indexOf( '(', callStart );
	if ( parenOpen === -1 ) {
		return { source, removed: false };
	}
	const parenClose = findBalancedEndSkippingLiterals(
		source,
		parenOpen,
		'(',
		')'
	);
	if ( parenClose === -1 ) {
		return { source, removed: false };
	}
	// Include trailing semicolon and whitespace
	let end = parenClose;
	if ( source[ end ] === ';' ) {
		end++;
	}
	while (
		end < source.length &&
		( source[ end ] === '\n' ||
			source[ end ] === '\r' ||
			source[ end ] === ' ' ||
			source[ end ] === '\t' )
	) {
		end++;
	}
	const before = source.slice( 0, callStart );
	const after = source.slice( end );
	return { source: before + after, removed: true };
}

function optionallyDropTitleTagSupport( source, enabled ) {
	if ( ! enabled ) {
		return { source, hooksRemoved: [], methodsRemoved: [] };
	}
	const hooksRemoved = [];
	const methodsRemoved = [];
	// Remove hook in initialize()
	const hookRes = removeInitializeHooks( source, [
		'action_title_tag_support',
	] );
	source = hookRes.source;
	if ( hookRes.removed.includes( 'action_title_tag_support' ) ) {
		hooksRemoved.push( 'action_title_tag_support' );
	}
	// Remove method
	const methRes = removeMethods( source, [ 'action_title_tag_support' ] );
	source = methRes.source;
	if ( methRes.removed.includes( 'action_title_tag_support' ) ) {
		methodsRemoved.push( 'action_title_tag_support' );
	}
	return { source, hooksRemoved, methodsRemoved };
}

function validateRemoval( source, methodNames, hookNames ) {
	const errors = [];
	for ( const name of methodNames ) {
		if ( new RegExp( String.raw`\b${ name }\b` ).test( source ) ) {
			errors.push( `Method name still present: ${ name }` );
		}
	}
	// Check initialize() hooks
	const initBodyMatch = /function\s+initialize\s*\(\)\s*\{([\s\S]*?)\}/m.exec(
		source
	);
	if ( initBodyMatch ) {
		const body = initBodyMatch[ 1 ];
		for ( const name of hookNames ) {
			if (
				new RegExp(
					String.raw`array\s*\(\s*\$this\s*,\s*['\"]${ name }['\"]\s*\)`
				).test( body )
			) {
				errors.push(
					`Hook to ${ name } still present in initialize()`
				);
			}
		}
	}
	return errors;
}

async function main() {
	const { dryRun, pruneHtml5, dropTitleTag } = parseArgs( process.argv );

	const exists = await fs
		.access( TARGET )
		.then( () => true )
		.catch( () => false );
	if ( ! exists ) {
		console.error( `File not found: ${ TARGET_REL }` );
		process.exitCode = 1;
		return;
	}

	const original = await fs.readFile( TARGET, 'utf8' );
	let source = original;

	const report = {
		file: TARGET_REL,
		changed: false,
		backupCreated: false,
		removedHooks: [],
		removedMethods: [],
		removedThemeSupports: [],
		prunedHtml5: false,
		droppedTitleTag: false,
	};

	// Remove specific initialize hooks
	const hookTargets = [
		'action_add_pingback_header',
		'filter_body_classes_add_hfeed',
		'filter_embed_dimensions',
		'filter_script_loader_tag',
	];
	const hookRes = removeInitializeHooks( source, hookTargets );
	source = hookRes.source;
	report.removedHooks.push( ...hookRes.removed );

	// Remove methods
	const methodTargets = [
		'action_add_pingback_header',
		'filter_body_classes_add_hfeed',
		'filter_embed_dimensions',
		'filter_script_loader_tag',
	];
	const methRes = removeMethods( source, methodTargets );
	source = methRes.source;
	report.removedMethods.push( ...methRes.removed );

	// Remove theme support lines
	const tsRes = removeThemeSupportLines( source, [
		'automatic-feed-links',
		'customize-selective-refresh-widgets',
	] );
	source = tsRes.source;
	report.removedThemeSupports.push( ...tsRes.removed );

	// Optional: prune html5 support block
	const html5Res = optionallyRemoveHtml5Support( source, pruneHtml5 );
	source = html5Res.source;
	if ( html5Res.removed ) {
		report.prunedHtml5 = true;
	}

	// Optional: drop title-tag support
	const titleRes = optionallyDropTitleTagSupport( source, dropTitleTag );
	source = titleRes.source;
	if ( titleRes.hooksRemoved.length || titleRes.methodsRemoved.length ) {
		report.droppedTitleTag = true;
		report.removedHooks.push( ...titleRes.hooksRemoved );
		report.removedMethods.push( ...titleRes.methodsRemoved );
	}

	// Trim any residual blank lines where we removed single lines
	source = source.replace( /\n{3,}/g, '\n\n' );

	// Validate intended removals (only the classic four and optionally title-tag)
	const validateMethods = [
		'action_add_pingback_header',
		'filter_body_classes_add_hfeed',
		'filter_embed_dimensions',
		'filter_script_loader_tag',
		...( dropTitleTag ? [ 'action_title_tag_support' ] : [] ),
	].filter( ( v, i, a ) => a.indexOf( v ) === i );
	const validateHooks = [
		'action_add_pingback_header',
		'filter_body_classes_add_hfeed',
		'filter_embed_dimensions',
		'filter_script_loader_tag',
		...( dropTitleTag ? [ 'action_title_tag_support' ] : [] ),
	];
	const errors = validateRemoval( source, validateMethods, validateHooks );
	if ( errors.length ) {
		console.error( 'Validation failed:', errors.join( '; ' ) );
		process.exitCode = 2;
		return;
	}

	// Safety check: ensure we still have the Component class and the file isn't near-empty
	if (
		! /class\s+Component\b/.test( source ) ||
		source.trim().length < 100
	) {
		console.error(
			'Safety check failed: resulting file does not contain expected class or appears truncated. Aborting.'
		);
		process.exitCode = 3;
		return;
	}

	report.changed = source !== original;

	if ( dryRun ) {
		// Print concise report
		printReport( report, true );
	} else {
		if ( report.changed ) {
			// Create backup once
			const backupPath = TARGET + '.bak';
			const backupExists = await fs
				.access( backupPath )
				.then( () => true )
				.catch( () => false );
			if ( ! backupExists ) {
				await fs.writeFile( backupPath, original, 'utf8' );
				report.backupCreated = true;
			}
			await fs.writeFile( TARGET, source, 'utf8' );
		}
		printReport( report, false );
	}

	// Also convert other components to match block theme state
	await processCustomizerComponent( dryRun );
	await processEZCustomizerComponent( dryRun );
	await processNavMenusComponent( dryRun );
}

function printReport( rep, dry ) {
	const status = rep.changed ? 'changed' : 'unchanged';
	const lines = [];
	lines.push( `${ rep.file }: ${ status }${ dry ? ' (dry-run)' : '' }` );
	if ( rep.backupCreated ) {
		lines.push( 'Backup created (.bak)' );
	}
	if ( rep.removedHooks.length ) {
		lines.push( 'Removed hooks: ' + rep.removedHooks.join( ', ' ) );
	}
	if ( rep.removedMethods.length ) {
		lines.push( 'Removed methods: ' + rep.removedMethods.join( ', ' ) );
	}
	if ( rep.removedThemeSupports.length ) {
		lines.push(
			'Removed theme supports: ' + rep.removedThemeSupports.join( ', ' )
		);
	}
	if ( rep.prunedHtml5 ) {
		lines.push( 'Pruned HTML5 support block' );
	}
	if ( rep.droppedTitleTag ) {
		lines.push( 'Dropped title-tag support' );
	}
	console.log( lines.join( '\n' ) );
}

// Export helpers for unit-like usage if ever imported
export {
	removeInitializeHooks,
	removeMethods,
	removeThemeSupportLines,
	optionallyRemoveHtml5Support,
	optionallyDropTitleTagSupport,
};

// Run if executed directly
{
	const invokedHref = process.argv[ 1 ]
		? pathToFileURL( process.argv[ 1 ] ).href
		: '';
	if ( invokedHref === import.meta.url ) {
		main().catch( ( err ) => {
			console.error( err );
			process.exitCode = 1;
		} );
	}
}

// Helpers for converting other components to block-theme guarded behavior
function getMethodBounds( source, methodName ) {
	const fnMatch = new RegExp(
		String.raw`function\s+${ methodName }\s*\(\)\s*\{`,
		'm'
	).exec( source );
	if ( ! fnMatch ) {
		return null;
	}
	const startBrace = fnMatch.index + fnMatch[ 0 ].lastIndexOf( '{' );
	const endPos = findBalancedEndSkippingLiterals(
		source,
		startBrace,
		'{',
		'}'
	);
	if ( endPos === -1 ) {
		return null;
	}
	return { startBrace, endPos };
}

async function processCustomizerComponent( dryRun ) {
	const REL = 'inc/Customizer/Component.php';
	const FILE = path.resolve( THEME_ROOT, REL );
	const exists = await fs
		.access( FILE )
		.then( () => true )
		.catch( () => false );
	if ( ! exists ) {
		return;
	}
	const original = await fs.readFile( FILE, 'utf8' );
	let source = original;

	const bounds = getMethodBounds( source, 'initialize' );
	const report = {
		file: REL,
		changed: false,
		backupCreated: false,
		removedHooks: [],
		removedMethods: [],
		removedThemeSupports: [],
		prunedHtml5: false,
		droppedTitleTag: false,
	};
	if ( bounds ) {
		const bodyStart = bounds.startBrace + 1;
		const bodyEnd = bounds.endPos - 1;
		const body = source.slice( bodyStart, bodyEnd );
		if ( ! /wp_is_block_theme\s*\(\s*\)/.test( body ) ) {
			const insertion =
				"\n\t\t// For block themes (FSE), hide the Customizer by not registering its hooks.\n\t\tif ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {\n\t\t\treturn;\n\t\t}\n";
			source =
				source.slice( 0, bodyStart ) +
				insertion +
				source.slice( bodyStart );
		}
	}

	report.changed = source !== original;
	if ( dryRun ) {
		printReport( report, true );
		return;
	}
	if ( report.changed ) {
		const backupPath = FILE + '.bak';
		const backupExists = await fs
			.access( backupPath )
			.then( () => true )
			.catch( () => false );
		if ( ! backupExists ) {
			await fs.writeFile( backupPath, original, 'utf8' );
			report.backupCreated = true;
		}
		// Safety: ensure file still sane
		if (
			! /class\s+Component\b/.test( source ) ||
			source.trim().length < 80
		) {
			console.error( `${ REL }: Safety check failed; aborting write.` );
			printReport( report, false );
			return;
		}
		await fs.writeFile( FILE, source, 'utf8' );
	}
	printReport( report, false );
}

async function processEZCustomizerComponent( dryRun ) {
	const REL = 'inc/EZ_Customizer/Component.php';
	const FILE = path.resolve( THEME_ROOT, REL );
	const exists = await fs
		.access( FILE )
		.then( () => true )
		.catch( () => false );
	if ( ! exists ) {
		return;
	}
	const original = await fs.readFile( FILE, 'utf8' );
	let source = original;
	const report = {
		file: REL,
		changed: false,
		backupCreated: false,
		removedHooks: [],
		removedMethods: [],
		removedThemeSupports: [],
		prunedHtml5: false,
		droppedTitleTag: false,
	};

	const bounds = getMethodBounds( source, 'initialize' );
	if ( bounds ) {
		const bodyStart = bounds.startBrace + 1;
		const bodyEnd = bounds.endPos - 1;
		let body = source.slice( bodyStart, bodyEnd );
		if ( ! /wp_is_block_theme\s*\(\s*\)/.test( body ) ) {
			const idx = body.indexOf( '$this->hooks(' );
			if ( idx !== -1 ) {
				const insertion =
					"\n\t\t// For block themes (FSE), do not register Customizer settings.\n\t\tif ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {\n\t\t\treturn;\n\t\t}\n";
				body = body.slice( 0, idx ) + insertion + body.slice( idx );
				source =
					source.slice( 0, bodyStart ) +
					body +
					source.slice( bodyEnd );
			}
		}
	}

	report.changed = source !== original;
	if ( dryRun ) {
		printReport( report, true );
		return;
	}
	if ( report.changed ) {
		const backupPath = FILE + '.bak';
		const backupExists = await fs
			.access( backupPath )
			.then( () => true )
			.catch( () => false );
		if ( ! backupExists ) {
			await fs.writeFile( backupPath, original, 'utf8' );
			report.backupCreated = true;
		}
		if (
			! /class\s+Component\b/.test( source ) ||
			source.trim().length < 100
		) {
			console.error( `${ REL }: Safety check failed; aborting write.` );
			printReport( report, false );
			return;
		}
		await fs.writeFile( FILE, source, 'utf8' );
	}
	printReport( report, false );
}

async function processNavMenusComponent( dryRun ) {
	const REL = 'inc/Nav_Menus/Component.php';
	const FILE = path.resolve( THEME_ROOT, REL );
	const exists = await fs
		.access( FILE )
		.then( () => true )
		.catch( () => false );
	if ( ! exists ) {
		return;
	}
	const original = await fs.readFile( FILE, 'utf8' );
	let source = original;
	const report = {
		file: REL,
		changed: false,
		backupCreated: false,
		removedHooks: [],
		removedMethods: [],
		removedThemeSupports: [],
		prunedHtml5: false,
		droppedTitleTag: false,
	};

	const bounds = getMethodBounds( source, 'hooks' );
	if ( bounds ) {
		const bodyStart = bounds.startBrace + 1;
		const bodyEnd = bounds.endPos - 1;
		let body = source.slice( bodyStart, bodyEnd );
		if (
			/action_register_nav_menus/.test( body ) &&
			! /wp_is_block_theme\s*\(\s*\)/.test( body )
		) {
			const re = new RegExp(
				String.raw`^(\s*)add_action\s*\(\s*['"]after_setup_theme['"]\s*,\s*array\s*\(\s*\$this\s*,\s*['"]action_register_nav_menus['"]\s*\)\s*\)\s*;\s*$`,
				'm'
			);
			const m = re.exec( body );
			if ( m ) {
				const indent = m[ 1 ] || '';
				const wrapped = `${ indent }// Only register classic nav menu locations for non-block themes.\n${ indent }if ( ! ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) ) {\n${ indent }\tadd_action( 'after_setup_theme', array( $this, 'action_register_nav_menus' ) );\n${ indent }}\n`;
				body = body.replace( re, wrapped );
				source =
					source.slice( 0, bodyStart ) +
					body +
					source.slice( bodyEnd );
			}
		}
	}

	report.changed = source !== original;
	if ( dryRun ) {
		printReport( report, true );
		return;
	}
	if ( report.changed ) {
		const backupPath = FILE + '.bak';
		const backupExists = await fs
			.access( backupPath )
			.then( () => true )
			.catch( () => false );
		if ( ! backupExists ) {
			await fs.writeFile( backupPath, original, 'utf8' );
			report.backupCreated = true;
		}
		if (
			! /class\s+Component\b/.test( source ) ||
			source.trim().length < 100
		) {
			console.error( `${ REL }: Safety check failed; aborting write.` );
			printReport( report, false );
			return;
		}
		await fs.writeFile( FILE, source, 'utf8' );
	}
	printReport( report, false );
}
