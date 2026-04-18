/* eslint-env es6 */
/* global test, expect */

/**
 * Internal dependencies
 */
import {
	processThemeUrls,
	insertAfterTopImports,
	ensureVirtualImportInserted,
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
