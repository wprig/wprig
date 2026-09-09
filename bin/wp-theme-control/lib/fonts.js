/**
 * wp-theme-control (Node port) — fonts scope (WP Rig fork, SPEC-016 §4).
 *
 * Copies Font Library custom families into assets/fonts/<slug>/ with
 * magic-byte signature validation and file:./ src rewrites (upstream
 * semantics), but the fontFamilies payload is written into the `fonts`
 * block of config/user-styles.json instead of theme.json. tokens.js remains
 * the sole theme.json writer and collapses the overlay fonts at merge time.
 */

import fs from 'fs';
import path from 'path';
import {
	assertSafeSlug,
	assertThemeTarget,
	createRun,
	die,
	finishRun,
	info,
	installFile,
	manifestAdd,
	wp,
	wpEval,
	FONT_SETTINGS_EVAL,
	OVERLAY_RELATIVE_PATH,
} from './context.js';
import {
	buildFontsOverlay,
	iterFontFaces,
	rewriteFontSources,
} from './overlay.js';
import { runClean } from './clean.js';

const FONT_SIGNATURES = {
	woff: [ '774f4646' ],
	woff2: [ '774f4632' ],
	otf: [ '4f54544f' ],
	ttf: [ '00010000', '74727565' ],
};

const FONT_EXTENSIONS = Object.keys( FONT_SIGNATURES );

const FONT_DOWNLOAD_EVAL = `
require_once ABSPATH . "wp-admin/includes/file.php";
$temporary_file = download_url( getenv( "WPCTL_FONT_SOURCE" ), 60 );
if ( is_wp_error( $temporary_file ) ) {
	fwrite( STDERR, $temporary_file->get_error_message() . "\\n" );
	exit( 1 );
}
$destination = getenv( "WPCTL_FONT_DESTINATION" );
if ( ! copy( $temporary_file, $destination ) ) {
	@unlink( $temporary_file );
	fwrite( STDERR, "Could not stage the downloaded font.\\n" );
	exit( 1 );
}
@unlink( $temporary_file );`;

/**
 * Validates a staged font file's magic-byte signature.
 *
 * @param {Buffer} buffer    File contents.
 * @param {string} extension Declared extension.
 * @return {boolean} True when the signature matches.
 */
export function validateFontFile( buffer, extension ) {
	if ( extension === 'eot' ) {
		return [ '00000100', '01000200', '02000200' ].includes(
			buffer.subarray( 8, 12 ).toString( 'hex' )
		);
	}

	const head = buffer.subarray( 0, 4 ).toString( 'hex' );
	return ( FONT_SIGNATURES[ extension ] || [] ).includes( head );
}

/**
 * Runs the fonts scope.
 *
 * @param {Object} ctx Loaded context (with parsed args).
 */
export function runFonts( ctx ) {
	const fontSettings = JSON.parse( wpEval( ctx, FONT_SETTINGS_EVAL ) );

	if (
		! Array.isArray( fontSettings.theme ) &&
		( fontSettings.custom || [] ).length === 0
	) {
		info( 'no Font Library activation changes found' );
		return;
	}

	const themeCount = ( fontSettings.theme || [] ).length;
	const customCount = ( fontSettings.custom || [] ).length;

	info( `active theme fonts selected: ${ themeCount }` );
	info( `custom Font Library families to copy: ${ customCount }` );

	if ( ctx.dryRun ) {
		for ( const family of fontSettings.custom || [] ) {
			info(
				`would copy custom font: ${ family.slug } ( ${
					( family.fontFace || [] ).length
				} face(s))`
			);
		}
		return;
	}

	const recordId = String( fontSettings.id ?? '' );
	if ( ! /^\d+$/.test( recordId ) ) {
		die( `invalid Global Styles post ID: ${ recordId }` );
	}

	const overlayTarget = path.join( ctx.themeDir, OVERLAY_RELATIVE_PATH );
	const themeJsonPath = path.join( ctx.themeDir, 'theme.json' );

	createRun( ctx, 'fonts' );
	const staging = path.join( ctx.runDir, 'staging' );
	const stageFontRoot = path.join( staging, 'assets', 'fonts' );
	fs.mkdirSync( stageFontRoot, { recursive: true } );

	const fontDirPath = fontSettings.font_dir?.path || '';
	const fontDirUrl = ( fontSettings.font_dir?.url || '' ).replace(
		/\/$/,
		''
	);
	const fontMap = {};

	for ( const face of iterFontFaces( fontSettings.custom || [] ) ) {
		assertSafeSlug( face.familySlug );
		if ( fontMap[ face.src ] ) {
			continue;
		}

		if ( face.src.startsWith( 'file:' ) ) {
			fontMap[ face.src ] = face.src;
			continue;
		}

		const sourcePath = face.src.split( '?' )[ 0 ].split( '#' )[ 0 ];
		const extension = path.extname( sourcePath ).slice( 1 ).toLowerCase();
		if ( ! FONT_EXTENSIONS.includes( extension ) ) {
			die( `unsupported font extension in source: ${ face.src }` );
		}

		let filename = face.fontFamily || face.familySlug;
		filename = slugifyComponent( filename ) || face.familySlug;
		const weightComponent = slugifyComponent( face.fontWeight || '' );
		const styleComponent = slugifyComponent( face.fontStyle || '' );
		const unicodeComponent = slugifyComponent( face.unicodeRange || '' );
		if ( weightComponent ) {
			filename += `-${ weightComponent }`;
		}
		if ( styleComponent ) {
			filename += `-${ styleComponent }`;
		}
		if ( unicodeComponent ) {
			filename += `-${ unicodeComponent }`;
		}
		if ( String( face.sourceIndex ) !== '0' ) {
			filename += `-${ face.sourceIndex }`;
		}
		filename += `.${ extension }`;

		const stageFamilyDir = path.join( stageFontRoot, face.familySlug );
		const stageFont = path.join( stageFamilyDir, filename );
		fs.mkdirSync( stageFamilyDir, { recursive: true } );

		if ( fontDirUrl && face.src.startsWith( fontDirUrl ) ) {
			const localName = path.basename( sourcePath );
			const localSource = path.join( fontDirPath, localName );
			if ( ! fs.existsSync( localSource ) ) {
				die( `Font Library file not found: ${ localSource }` );
			}
			if (
				fs.existsSync( stageFont ) &&
				! fs
					.readFileSync( localSource )
					.equals( fs.readFileSync( stageFont ) )
			) {
				die(
					`two font sources resolve to the same theme path: ${ stageFont }`
				);
			}
			fs.copyFileSync( localSource, stageFont );
		} else {
			if ( fs.existsSync( stageFont ) ) {
				die(
					`two remote font sources resolve to the same theme path: ${ stageFont }`
				);
			}
			wp( ctx, [ 'eval', FONT_DOWNLOAD_EVAL ], {
				env: {
					WPCTL_FONT_SOURCE: face.src,
					WPCTL_FONT_DESTINATION: stageFont,
				},
			} );
			if ( ! fs.existsSync( stageFont ) ) {
				die( `font download did not produce a file: ${ face.src }` );
			}
		}

		if ( ! validateFontFile( fs.readFileSync( stageFont ), extension ) ) {
			die(
				`font signature does not match .${ extension }: ${ face.src }`
			);
		}

		fontMap[
			face.src
		] = `file:./assets/fonts/${ face.familySlug }/${ filename }`;
	}

	const rewrittenCustom = rewriteFontSources(
		fontSettings.custom || [],
		fontMap
	);

	// Theme family definitions come from the (generated) theme.json, filtered
	// by the Font Library activation list — same semantics as upstream.
	let existingFamilies = [];
	if ( fs.existsSync( themeJsonPath ) ) {
		const themeJson = JSON.parse(
			fs.readFileSync( themeJsonPath, 'utf8' )
		);
		existingFamilies = themeJson?.settings?.typography?.fontFamilies || [];
	}
	const activeSlugs = ( fontSettings.theme || [] ).map(
		( family ) => family.slug
	);
	const themeFamilies = Array.isArray( fontSettings.theme )
		? existingFamilies.filter( ( family ) =>
				activeSlugs.includes( family.slug )
		  )
		: existingFamilies;

	const existingOverlay = fs.existsSync( overlayTarget )
		? JSON.parse( fs.readFileSync( overlayTarget, 'utf8' ) )
		: null;
	const overlay = buildFontsOverlay( existingOverlay, {
		themeFamilies,
		customFamilies: rewrittenCustom,
		recordId,
		capturedAt: new Date().toISOString().replace( /\.\d+Z$/, 'Z' ),
	} );
	const stageOverlay = path.join( staging, 'user-styles.json' );
	fs.writeFileSync( stageOverlay, JSON.stringify( overlay, null, 2 ) + '\n' );

	if ( fs.existsSync( stageFontRoot ) ) {
		for ( const relative of listRelativeFiles( stageFontRoot ) ) {
			const stageFont = path.join( stageFontRoot, relative );
			const targetFont = path.join(
				ctx.themeDir,
				'assets',
				'fonts',
				relative
			);
			installFile( ctx, stageFont, targetFont );
			manifestAdd( ctx, 'font_asset', recordId, relative, targetFont );
			info( `copied font -> ${ targetFont }` );
		}
	}

	installFile( ctx, stageOverlay, overlayTarget );
	assertThemeTarget( ctx, overlayTarget );
	manifestAdd(
		ctx,
		'user_styles_overlay',
		recordId,
		ctx.themeSlug,
		overlayTarget
	);
	manifestAdd(
		ctx,
		'wp_global_styles_fonts',
		recordId,
		ctx.themeSlug,
		themeJsonPath
	);
	info( `persisted Font Library settings -> ${ overlayTarget }` );
	finishRun( ctx );

	if ( ctx.clean ) {
		runClean( ctx, ctx.manifest );
	}
}

function slugifyComponent( value ) {
	return String( value )
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
}

function listRelativeFiles( root ) {
	const out = [];
	const walk = ( dir ) => {
		for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
			const full = path.join( dir, entry.name );
			if ( entry.isDirectory() ) {
				walk( full );
			} else {
				out.push( path.relative( root, full ) );
			}
		}
	};
	walk( root );
	return out.sort();
}
