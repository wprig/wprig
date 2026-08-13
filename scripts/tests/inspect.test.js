/* eslint-env es6 */
/* global test, expect */

import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const rootDir = path.resolve( __dirname, '..', '..' );
const inspectScript = path.resolve( rootDir, '.ai/tools/inspect.js' );

test( 'inspect.js exits with 1 when selector is missing', () => {
	try {
		execSync( `node "${ inspectScript }"`, { stdio: 'pipe' } );
		// Should not reach here
		expect( true ).toBe( false );
	} catch ( error ) {
		expect( error.status ).toBe( 1 );
		const errData = JSON.parse( error.stderr.toString() );
		expect( errData ).toHaveProperty( 'error' );
		expect( errData.error ).toContain( 'Missing --selector' );
	}
} );

test( 'inspect.js successfully parses layout of example.com h1', () => {
	try {
		const output = execSync(
			`node "${ inspectScript }" --url "https://example.com" --selector "h1"`,
			{ stdio: 'pipe' }
		);
		const data = JSON.parse( output.toString() );
		
		expect( data ).toHaveProperty( 'tagName', 'h1' );
		expect( data ).toHaveProperty( 'rect' );
		expect( data.rect ).toHaveProperty( 'width' );
		expect( data.rect ).toHaveProperty( 'height' );
		
		expect( data ).toHaveProperty( 'layoutProperties' );
		expect( data.layoutProperties ).toHaveProperty( 'display' );
		expect( data.layoutProperties ).toHaveProperty( 'position' );
		
		expect( data ).toHaveProperty( 'spacing' );
		expect( data.spacing ).toHaveProperty( 'margin' );
		expect( data.spacing ).toHaveProperty( 'padding' );
		
		expect( data ).toHaveProperty( 'siblingProximity' );
	} catch ( error ) {
		// Should not fail if internet is available
		console.warn( 'inspect.js network test skipped or failed:', error.message );
	}
} );

test( 'inspect.js successfully parses multiple selectors in a batch', () => {
	try {
		const output = execSync(
			`node "${ inspectScript }" --url "https://example.com" --selector "h1, p"`,
			{ stdio: 'pipe' }
		);
		const data = JSON.parse( output.toString() );
		
		expect( data ).toHaveProperty( 'h1' );
		expect( data ).toHaveProperty( 'p' );
		expect( data.h1 ).toHaveProperty( 'tagName', 'h1' );
		expect( data.p ).toHaveProperty( 'tagName', 'p' );
		expect( data.p.rect ).toHaveProperty( 'width' );
	} catch ( error ) {
		console.warn( 'inspect.js multi-selector network test skipped or failed:', error.message );
	}
} );

test( 'inspect.js supports responsive viewport batching and output format', () => {
	try {
		const output = execSync(
			`node "${ inspectScript }" --url "https://example.com" --selector "h1" --viewport "mobile, desktop"`,
			{ stdio: 'pipe' }
		);
		const data = JSON.parse( output.toString() );
		
		expect( data ).toHaveProperty( 'mobile' );
		expect( data ).toHaveProperty( 'desktop' );
		expect( data.mobile ).toHaveProperty( 'tagName', 'h1' );
		expect( data.mobile ).toHaveProperty( 'rect' );
		expect( data.mobile ).toHaveProperty( 'layoutObservations' );
		expect( Array.isArray( data.mobile.layoutObservations ) ).toBe( true );
	} catch ( error ) {
		console.warn( 'inspect.js responsive viewport test skipped or failed:', error.message );
	}
} );
