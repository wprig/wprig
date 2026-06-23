import { chromium } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { logger } from '../lib/rig-utils.js';

/**
 * Compares a live screenshot of the site against a mockup image.
 *
 * @param {string} themeRoot Path to the theme root.
 * @param {Object} options   Comparison options.
 */
export default async function screenshotCompare( themeRoot, options = {} ) {
	let finalMockupPath =
		options.mockupPath || path.join( themeRoot, 'docs', 'mockup.png' );

	if ( ! ( await fs.pathExists( finalMockupPath ) ) ) {
		// Try fallback to screenshot.png at root if mockup.png doesn't exist
		const fallbackPath = path.join( themeRoot, 'screenshot.png' );
		if ( await fs.pathExists( fallbackPath ) ) {
			logger.warn(
				`Mockup not found at ${ finalMockupPath }. Using ${ fallbackPath } instead.`
			);
			finalMockupPath = fallbackPath;
		} else {
			logger.error( `Mockup file not found at ${ finalMockupPath }` );
			return;
		}
	}

	const {
		url = 'http://wprig.test:8888',
		outputPath = path.join( themeRoot, 'artifacts', 'visual-regression' ),
		fullPage = true,
	} = options;

	await fs.ensureDir( outputPath );
	const liveScreenshotPath = path.join( outputPath, 'live.png' );
	const diffPath = path.join( outputPath, 'diff.png' );

	logger.info( `Taking screenshot of ${ url }...` );

	const browser = await chromium.launch();
	const page = await browser.newPage();

	try {
		await page.setViewportSize( { width: 1200, height: 800 } );
		await page.goto( url, { waitUntil: 'networkidle' } );
		// Give it a moment for any animations to settle
		await page.waitForTimeout( 1000 );
		await page.screenshot( { path: liveScreenshotPath, fullPage } );
		logger.success( `Live screenshot saved to ${ liveScreenshotPath }` );
	} catch ( error ) {
		logger.error( `Failed to take screenshot: ${ error.message }` );
		await browser.close();
		return;
	}

	await browser.close();

	logger.info( `Comparing against ${ finalMockupPath }...` );

	try {
		const mockupBuffer = fs.readFileSync( finalMockupPath );
		const img1 = PNG.sync.read( mockupBuffer );
		const liveBuffer = fs.readFileSync( liveScreenshotPath );
		let img2 = PNG.sync.read( liveBuffer );

		// Pixelmatch requires exact same dimensions
		if ( img1.width !== img2.width || img1.height !== img2.height ) {
			logger.warn(
				`Dimensions mismatch! Mockup: ${ img1.width }x${ img1.height }, Live: ${ img2.width }x${ img2.height }`
			);
			logger.info(
				'Resizing live screenshot to match mockup dimensions...'
			);

			const resizedLiveBuffer = await sharp( liveBuffer )
				.resize( img1.width, img1.height, { fit: 'fill' } )
				.toBuffer();

			img2 = PNG.sync.read( resizedLiveBuffer );
		}

		const { width, height } = img1;
		const diff = new PNG( { width, height } );

		const numDiffPixels = pixelmatch(
			img1.data,
			img2.data,
			diff.data,
			width,
			height,
			{ threshold: 0.1 }
		);

		fs.writeFileSync( diffPath, PNG.sync.write( diff ) );

		const totalPixels = width * height;
		const fidelityScore =
			( ( totalPixels - numDiffPixels ) / totalPixels ) * 100;

		logger.log( '\n' + '='.repeat( 40 ) );
		logger.log( '   VISUAL FIDELITY REPORT' );
		logger.log( '='.repeat( 40 ) );
		logger.log( `Target URL:       ${ url }` );
		logger.log( `Total Pixels:     ${ totalPixels.toLocaleString() }` );
		logger.log( `Mismatched:       ${ numDiffPixels.toLocaleString() }` );
		logger.log( `Fidelity Score:    ${ fidelityScore.toFixed( 2 ) }%` );
		logger.log( `Diff Output:      ${ diffPath }` );
		logger.log( '='.repeat( 40 ) + '\n' );

		if ( fidelityScore >= 98 ) {
			logger.success(
				'✓ Exceptional fidelity achieved! Perfect or near-perfect match.'
			);
		} else if ( fidelityScore >= 95 ) {
			logger.success( '✓ High fidelity achieved!' );
		} else if ( fidelityScore >= 90 ) {
			logger.warn(
				'⚠ Moderate fidelity. Some visible discrepancies found.'
			);
		} else {
			logger.error(
				'✗ Low fidelity score. Significant design deviations detected.'
			);
		}

		return fidelityScore;
	} catch ( error ) {
		logger.error( `Failed to compare images: ${ error.message }` );
	}
}
