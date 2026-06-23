/* eslint-env es6 */
/* global test, expect */

/**
 * Internal dependencies
 */
import { destPathFor } from '../lib/filepipe.js';
import path from 'node:path';

test( 'destPathFor computes relative destination path', () => {
	const srcFile = path.join( 'src', 'assets', 'css', 'main.css' );
	const baseDir = 'src';
	const destRoot = 'dist';
	const result = destPathFor( srcFile, baseDir, destRoot );
	expect( result ).toBe( path.join( 'dist', 'assets', 'css', 'main.css' ) );
} );
