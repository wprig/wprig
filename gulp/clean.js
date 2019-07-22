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
	return del( delPath );
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
	return del( delPath );
}
