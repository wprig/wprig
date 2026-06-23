/* eslint-env es6 */
/* global test, expect */

/**
 * Internal dependencies
 */
import { runTask } from '../lib/cli-utils.js';

test( 'runTask resolves on synchronous function', async () => {
	const fn = () => 'done';
	await expect( runTask( fn ) ).resolves.toBeUndefined();
} );

test( 'runTask resolves on promise-returning function', async () => {
	const fn = () => Promise.resolve( 'done' );
	await expect( runTask( fn ) ).resolves.toBe( 'done' );
} );

test( 'runTask resolves on callback-style function', async () => {
	const fn = ( cb ) => setTimeout( () => cb(), 10 );
	await expect( runTask( fn ) ).resolves.toBeUndefined();
} );

test( 'runTask rejects on thrown error', async () => {
	const fn = () => {
		throw new Error( 'boom' );
	};
	await expect( runTask( fn, 'test-task' ) ).rejects.toThrow(
		'test-task threw: boom'
	);
} );

test( 'runTask rejects on rejected promise', async () => {
	const fn = () => Promise.reject( new Error( 'boom' ) );
	await expect( runTask( fn, 'test-task' ) ).rejects.toThrow(
		'test-task failed: boom'
	);
} );

test( 'runTask rejects on callback error', async () => {
	const fn = ( cb ) => setTimeout( () => cb( new Error( 'boom' ) ), 10 );
	await expect( runTask( fn, 'test-task' ) ).rejects.toThrow(
		'test-task failed: boom'
	);
} );
