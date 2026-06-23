import { promises as fs } from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';

const THEME_ROOT = process.cwd();
const TARGET_REL = 'inc/Base_Support/Component.php';
const TARGET = path.resolve( THEME_ROOT, TARGET_REL );

/**
 * Robust balanced end finder that skips strings and comments.
 *
 * @param {string} source    Source code
 * @param {number} openIndex Index of opening character
 * @param {string} openChar  Opening character
 * @param {string} closeChar Closing character
 * @return {number} Index after matching close character, or -1
 */
function findBalancedEndSkippingLiterals(
	source,
	openIndex,
	openChar = '{',
	closeChar = '}'
) {
	let i = openIndex;
	const len = source.length;

	if ( source[ i ] !== openChar ) {
		i = source.indexOf( openChar, openIndex );
		if ( i === -1 ) {
			return -1;
		}
	}

	let depth = 1;
	i++;

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
				i += 2;
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

		if ( ch === openChar ) {
			depth++;
		} else if ( ch === closeChar ) {
			depth--;
			if ( depth === 0 ) {
				return i + 1;
			}
		}
		i++;
	}
	return -1;
}

/**
 * Gets the range of a function/method in the source code.
 *
 * @param {string} source Source code
 * @param {string} name   Function/Method name
 * @return {Object|null} { start, end } range
 */
function getFunctionRange( source, name ) {
	const regex = new RegExp(
		`(?:public|protected|private|static)?\\s*function\\s+${ name }\\s*\\(`,
		'g'
	);
	const match = regex.exec( source );
	if ( ! match ) {
		return null;
	}

	const start = match.index;
	const openBraceIndex = source.indexOf( '{', start + match[ 0 ].length );
	if ( openBraceIndex === -1 ) {
		return null;
	}

	const end = findBalancedEndSkippingLiterals( source, openBraceIndex );
	if ( end === -1 ) {
		return null;
	}

	return { start, end };
}

/**
 * Removes a method from the source code.
 *
 * @param {string} source Source code
 * @param {string} name   Method name
 * @return {string} Modified source code
 */
function removeMethod( source, name ) {
	const range = getFunctionRange( source, name );
	if ( ! range ) {
		return source;
	}

	let start = range.start;
	while ( start > 0 && /\s/.test( source[ start - 1 ] ) ) {
		start--;
	}

	const docBlockEnd = source.lastIndexOf( '*/', start );
	if ( docBlockEnd !== -1 ) {
		const potentialDocStart = source.lastIndexOf( '/**', docBlockEnd );
		if ( potentialDocStart !== -1 ) {
			const textBetween = source.substring(
				potentialDocStart + 2,
				start
			);
			if ( ! /function|class|var|const/i.test( textBetween ) ) {
				start = potentialDocStart;
				while ( start > 0 && /\s/.test( source[ start - 1 ] ) ) {
					start--;
				}
			}
		}
	}

	return source.substring( 0, start ) + source.substring( range.end );
}

/**
 * Runs the conversion to block theme.
 *
 * @param {Object} options Conversion options
 */
export default async function convertToBlockTheme( options = {} ) {
	if ( ! fsExtra.existsSync( TARGET ) ) {
		console.error( `Error: Target file not found at ${ TARGET }` );
		return;
	}

	console.log( `Converting ${ TARGET_REL } to block-based...` );

	let source = await fs.readFile( TARGET, 'utf8' );

	if ( ! options.dryRun ) {
		const backup = TARGET + '.bak';
		if ( ! fsExtra.existsSync( backup ) ) {
			await fs.writeFile( backup, source );
			console.log( `Created backup at ${ TARGET_REL }.bak` );
		}
	}

	// 1) Remove classic-only hooks from initialize()
	const initRange = getFunctionRange( source, 'initialize' );
	if ( initRange ) {
		let initBody = source.substring( initRange.start, initRange.end );
		const classicHooks = [
			"add_action( 'after_setup_theme', [ $this, 'add_theme_support' ] );",
			"add_action( 'wp_head', [ $this, 'add_pingback_header' ] );",
			"add_action( 'widgets_init', [ $this, 'register_sidebars' ] );",
		];

		classicHooks.forEach( ( hook ) => {
			const escaped = hook.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
			const regex = new RegExp( `^\\s*${ escaped }\\s*$`, 'm' );
			initBody = initBody.replace( regex, '' );
		} );

		source =
			source.substring( 0, initRange.start ) +
			initBody +
			source.substring( initRange.end );
	}

	// 2) Remove classic-only methods
	const methodsToRemove = [ 'add_pingback_header', 'register_sidebars' ];

	methodsToRemove.forEach( ( method ) => {
		source = removeMethod( source, method );
	} );

	// 3) Handle add_theme_support
	const atsRange = getFunctionRange( source, 'add_theme_support' );
	if ( atsRange ) {
		let atsBody = source.substring( atsRange.start, atsRange.end );

		const supportsToRemove = [
			'customize-selective-refresh-widgets',
			'core-block-patterns',
		];

		supportsToRemove.forEach( ( s ) => {
			const regex = new RegExp(
				`^\\s*add_theme_support\\(\\s*['"]${ s }['"]\\s*\\);\\s*$`,
				'm'
			);
			atsBody = atsBody.replace( regex, '' );
		} );

		if ( options.dropTitleTag ) {
			atsBody = atsBody.replace(
				/^\s*add_theme_support\(\s*['"]title-tag['"]\s*\);\s*$/m,
				''
			);
		}

		if ( options.pruneHtml5 ) {
			const html5Regex =
				/add_theme_support\(\s*['"]html5['"][\s\S]*?\);/g;
			atsBody = atsBody.replace( html5Regex, '' );
		}

		source =
			source.substring( 0, atsRange.start ) +
			atsBody +
			source.substring( atsRange.end );
	}

	if ( options.dryRun ) {
		console.log( 'Dry-run: changes not saved.' );
		console.log( source );
	} else {
		await fs.writeFile( TARGET, source );
		console.log( `Successfully updated ${ TARGET_REL }` );
	}

	// 4) Additional FSE tasks: create directories
	const dirs = [ 'parts', 'templates' ];
	for ( const d of dirs ) {
		const dirPath = path.resolve( THEME_ROOT, d );
		if ( ! fsExtra.existsSync( dirPath ) ) {
			if ( options.dryRun ) {
				console.log( `Dry-run: would create directory ${ d }` );
			} else {
				await fsExtra.ensureDir( dirPath );
				console.log( `Created directory ${ d }` );
			}
		}
	}
}
