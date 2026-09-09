/**
 * wp-theme-control (Node port) — plan scope (read-only inventory).
 *
 * Prints what would be baked: custom templates/parts (with runtime-URL
 * collision reports), Global Styles status, Font Library activations, and
 * unsynced user-created patterns. Writes nothing.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import {
	assertSafeSlug,
	info,
	warn,
	wp,
	wpEval,
	GLOBAL_STYLES_STATUS_EVAL,
	FONT_SETTINGS_EVAL,
	TEMPLATE_INVENTORY_EVAL,
} from './context.js';
import { rewriteRuntimeUrls } from './runtime-urls.js';
import {
	runtimePatternIsManaged,
	runtimePatternSlug,
	unsyncedPatternIds,
} from './patterns.js';

/**
 * Runs the plan scope.
 *
 * @param {Object} ctx Loaded context (with parsed args).
 */
export function runPlan( ctx ) {
	const templates = JSON.parse(
		wpEval( ctx, TEMPLATE_INVENTORY_EVAL ) || '[]'
	);
	const styles = JSON.parse( wpEval( ctx, GLOBAL_STYLES_STATUS_EVAL ) );
	const fonts = JSON.parse( wpEval( ctx, FONT_SETTINGS_EVAL ) );
	const patternIds = unsyncedPatternIds( ctx );

	const inspectDir = fs.mkdtempSync( path.join( os.tmpdir(), 'wtc-plan-' ) );

	try {
		info( `active theme: ${ ctx.themeSlug } (${ ctx.themeDir })` );
		info( `custom templates and parts: ${ templates.length }` );

		for ( const template of templates ) {
			info(
				`  ${ template.type }\t${ template.id }\t${ template.title }`
			);
			assertSafeSlug( template.slug );
			const sourcePath = path.join(
				inspectDir,
				`${ template.type }-${ template.slug }.source.html`
			);
			const outputPath = path.join(
				inspectDir,
				`${ template.type }-${ template.slug }.output.html`
			);
			const reportPath = path.join(
				inspectDir,
				`${ template.type }-${ template.slug }.report.json`
			);
			fs.writeFileSync(
				sourcePath,
				wp(
					ctx,
					[
						'block',
						'template',
						'export',
						template.id,
						`--type=${ template.type }`,
						'--stdout',
					],
					{ capture: true }
				)
			);
			rewriteRuntimeUrls( ctx, sourcePath, outputPath, reportPath );
			const runtimeCount = JSON.parse(
				fs.readFileSync( reportPath, 'utf8' )
			).total;

			if ( runtimeCount > 0 ) {
				const patternTarget = path.join(
					ctx.themeDir,
					'patterns',
					`${ runtimePatternSlug(
						template.type,
						template.slug
					) }.php`
				);
				const status =
					fs.existsSync( patternTarget ) &&
					! runtimePatternIsManaged(
						patternTarget,
						template.type,
						template.slug
					)
						? 'COLLISION'
						: 'runtime pattern';
				info(
					`  runtime_urls\t${ template.wp_id }\t${ runtimeCount }\t${ status }\t${ patternTarget }`
				);
			}
		}

		info( `non-font Global Styles changes: ${ styles.has_style_changes }` );
		info(
			`active theme fonts recorded by Font Library: ${
				( fonts.theme || [] ).length
			}`
		);
		info(
			`custom Font Library families: ${ ( fonts.custom || [] ).length }`
		);
		info( `unsynced user-created patterns: ${ patternIds.length }` );

		for ( const id of patternIds ) {
			const slug = wp( ctx, [ 'post', 'get', id, '--field=post_name' ], {
				capture: true,
			} ).trim();
			const title = wp(
				ctx,
				[ 'post', 'get', id, '--field=post_title' ],
				{ capture: true }
			).trim();
			assertSafeSlug( slug );
			const target = path.join(
				ctx.themeDir,
				'patterns',
				`${ slug }.php`
			);
			const sourcePath = path.join(
				inspectDir,
				`wp_block-${ slug }.source.html`
			);
			const outputPath = path.join(
				inspectDir,
				`wp_block-${ slug }.output.html`
			);
			const reportPath = path.join(
				inspectDir,
				`wp_block-${ slug }.report.json`
			);
			fs.writeFileSync(
				sourcePath,
				wp( ctx, [ 'post', 'get', id, '--field=post_content' ], {
					capture: true,
				} )
			);
			rewriteRuntimeUrls( ctx, sourcePath, outputPath, reportPath );
			const runtimeCount = JSON.parse(
				fs.readFileSync( reportPath, 'utf8' )
			).total;
			const status = fs.existsSync( target ) ? 'COLLISION' : 'new';
			info(
				`  wp_block\t${ id }\t${ slug }\t${ status }\t${ title }\t${ runtimeCount } runtime URL(s)`
			);
		}

		const themeJsonPath = path.join( ctx.themeDir, 'theme.json' );
		if ( fs.existsSync( themeJsonPath ) ) {
			const report = rewriteRuntimeUrlsReportOnly(
				ctx,
				themeJsonPath,
				inspectDir
			);
			if ( report.total > 0 ) {
				warn(
					`theme.json contains ${ report.total } local absolute URL(s); JSON cannot use runtime PHP`
				);
			}
		}

		if (
			templates.length === 0 &&
			styles.has_style_changes !== true &&
			( fonts.theme || [] ).length === 0 &&
			( fonts.custom || [] ).length === 0 &&
			patternIds.length === 0
		) {
			info( 'nothing to bake' );
		}
	} finally {
		fs.rmSync( inspectDir, { recursive: true, force: true } );
	}
}

function rewriteRuntimeUrlsReportOnly( ctx, inputPath, scratchDir ) {
	const outputPath = path.join( scratchDir, 'theme-json.output' );
	const reportPath = path.join( scratchDir, 'theme-json.report.json' );
	rewriteRuntimeUrls( ctx, inputPath, outputPath, reportPath );
	return JSON.parse( fs.readFileSync( reportPath, 'utf8' ) );
}
