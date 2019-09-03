/* eslint-env es6 */
'use strict';

/**
 * External dependencies
 */
import del from 'del';

/**
 * Internal dependencies
 */
import { paths } from './constants';

/**
 * Clean CSS
 * @return {Promise|string} with the deleted paths
 */
export function cleanCSS() {
	const delPath = [
		`${ paths.styles.dest }/**/*.css`,
		`!${ paths.styles.srcDir }`,
		`!${ paths.styles.srcDir }/**`,
	];

	const keepExportPath = paths.export.src
		.filter( ( path ) => path.indexOf( '/css/' ) !== -1 )
		.map( ( path ) => `!${ path }` );

	return del( delPath.concat( keepExportPath ) );
}

/**
 * Clean JS
 * @return {Promise|string} with the deleted paths
 */
export function cleanJS() {
	const delPath = [
		`${ paths.scripts.dest }/**/*.js`,
		`!${ paths.scripts.srcDir }`,
		`!${ paths.scripts.srcDir }/**`,
	];

	const keepExportPath = paths.export.src
		.filter( ( path ) => path.indexOf( '/js/' ) !== -1 )
		.map( ( path ) => `!${ path }` );

	return del( delPath.concat( keepExportPath ) );
}
