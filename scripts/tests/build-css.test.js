import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	processThemeUrls,
	insertAfterTopImports,
	ensureVirtualImportInserted,
	buildPreloadList,
} from '../../build-css.js';

test( 'processThemeUrls replaces ~theme/ with absolute theme path', () => {
	const css = '.test { background: url("~theme/assets/images/logo.png"); }';
	const result = processThemeUrls( css );
	// We expect the theme name to be 'wprig' by default in tests (as defined in build-css.js or config)
	expect( result ).toContain( '/wp-content/themes/' );
	expect( result ).toContain( '/assets/images/logo.png' );
} );

test( 'processThemeUrls handles var(--theme-assets-path)', () => {
	const css =
		'.test { background: url(var(--theme-assets-path)/images/logo.png); }';
	const result = processThemeUrls( css );
	expect( result ).toContain( '/wp-content/themes/' );
	expect( result ).toContain( '/images/logo.png' );
} );

test( 'insertAfterTopImports inserts snippet correctly', () => {
	const css = '@import "other.css";\n.body { color: red; }';
	const snippet = '@import "virtual.css";\n';
	const result = insertAfterTopImports( css, snippet );
	expect( result ).toBe(
		'@import "other.css";\n@import "virtual.css";\n.body { color: red; }'
	);
} );

test( 'insertAfterTopImports handles charset', () => {
	const css =
		'@charset "UTF-8";\n@import "other.css";\n.body { color: red; }';
	const snippet = '/* test */\n';
	const result = insertAfterTopImports( css, snippet );
	expect( result ).toBe(
		'@charset "UTF-8";\n@import "other.css";\n/* test */\n.body { color: red; }'
	);
} );

test( 'ensureVirtualImportInserted is idempotent', () => {
	const css = '.test { color: blue; }';
	const first = ensureVirtualImportInserted( css );
	const second = ensureVirtualImportInserted( first );
	expect( first ).toContain( '@import "virtual:preload.css"' );
	expect( second ).toBe( first );
} );

describe( 'buildPreloadList — block-based preload gating (Track B Phase 3 / D13)', () => {
	const styles = {
		preload: [ '_custom-media.css' ],
		preloadBlockBased: [ '_blocks-based.css' ],
	};

	test( 'excludes preloadBlockBased for classic builds', () => {
		expect( buildPreloadList( styles, false ) ).toEqual( [
			'_custom-media.css',
		] );
	} );

	test( 'appends preloadBlockBased when block-based is enabled', () => {
		expect( buildPreloadList( styles, true ) ).toEqual( [
			'_custom-media.css',
			'_blocks-based.css',
		] );
	} );

	test( 'tolerates a missing preloadBlockBased key', () => {
		expect(
			buildPreloadList( { preload: [ '_custom-media.css' ] }, true )
		).toEqual( [ '_custom-media.css' ] );
	} );
} );

describe( 'gate check — _blocks-based.css is only referenced by the build', () => {
	test( 'no non-_blocks*.css source references _blocks-based.css', () => {
		const __filename = fileURLToPath( import.meta.url );
		const __dirname = path.dirname( __filename );
		const srcDir = path.resolve( __dirname, '../../assets/css/src' );
		const offenders = [];

		for ( const file of fs.readdirSync( srcDir ) ) {
			if ( ! file.endsWith( '.css' ) || file.startsWith( '_blocks' ) ) {
				continue;
			}
			const content = fs.readFileSync(
				path.join( srcDir, file ),
				'utf8'
			);
			if ( content.includes( '_blocks-based' ) ) {
				offenders.push( file );
			}
		}

		expect(
			offenders,
			'classic partials must not reference _blocks-based.css'
		).toEqual( [] );
	} );
} );
