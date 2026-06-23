import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

export const exec = promisify( execCb );

/**
 * Utility to run possibly callback-style tasks as promises.
 *
 * @param {Function} fn   Task function
 * @param {string}   name Task name
 * @return {Promise} Resolves when task is complete
 */
export function runTask( fn, name = fn?.name || 'task' ) {
	return new Promise( ( resolve, reject ) => {
		try {
			if ( typeof fn === 'function' ) {
				if ( fn.length >= 1 ) {
					fn( ( err ) => {
						if ( err ) {
							reject(
								new Error(
									`${ name } failed: ${ err?.message || err }`
								)
							);
						} else {
							resolve();
						}
					} );
					return;
				}
				const result = fn();
				if ( result && typeof result.then === 'function' ) {
					result
						.then( resolve )
						.catch( ( e ) =>
							reject(
								new Error(
									`${ name } failed: ${ e?.message || e }`
								)
							)
						);
				} else {
					resolve();
				}
				return;
			}
			resolve();
		} catch ( e ) {
			reject( new Error( `${ name } threw: ${ e?.message || e }` ) );
		}
	} );
}

/**
 * Lints CSS using stylelint.
 */
export async function lintCSS() {
	await exec( 'node lint-css.js', { stdio: 'inherit' } );
}

/**
 * Lints JS using eslint.
 */
export async function lintJS() {
	await exec(
		'cross-env ESLINT_USE_FLAT_CONFIG=true eslint "assets/js/src/**/*.{js,jsx,ts,tsx}"',
		{ stdio: 'inherit' }
	);
}

/**
 * Builds JS assets.
 *
 * @param {Object}  options     Build options
 * @param {boolean} options.dev Development mode
 */
export async function buildJS( { dev = false } = {} ) {
	const cmd = dev ? 'npm run dev:js' : 'npm run build:js';
	const { stderr } = await exec( cmd );
	if ( stderr ) {
		console.error( stderr );
	}
}

/**
 * Builds CSS assets.
 *
 * @param {Object}  options     Build options
 * @param {boolean} options.dev Development mode
 */
export async function buildCSS( { dev = false } = {} ) {
	const cmd = dev ? 'npm run dev:css' : 'npm run build:css';
	const { stderr } = await exec( cmd );
	if ( stderr ) {
		console.error( stderr );
	}
}

/**
 * Builds Gutenberg blocks.
 */
export async function buildBlocks() {
	const { stderr } = await exec( 'npm run build:blocks' );
	if ( stderr ) {
		console.error( stderr );
	}
}
