/**
 * wp-theme-control (Node port) — templates scope.
 *
 * Exports custom templates and template parts via `wp block template export`
 * (WP-CLI 3.0+). Templates whose content contains runtime URLs are
 * patternized into patterns/hidden-*.php (Inserter: no) and the template
 * file becomes a wp:pattern reference.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import {
	assertSafeSlug,
	createRun,
	CLEAR_PATTERN_CACHE_EVAL,
	die,
	finishRun,
	info,
	installFile,
	manifestAdd,
	wp,
	wpEval,
	wpTry,
	THEME_FOLDERS_EVAL,
	TEMPLATE_INVENTORY_EVAL,
} from './context.js';
import { rewriteRuntimeUrls } from './runtime-urls.js';
import {
	buildPatternFile,
	runtimePatternDescription,
	runtimePatternIsManaged,
	runtimePatternSlug,
} from './patterns.js';
import { runClean } from './clean.js';

/**
 * Runs the templates scope.
 *
 * @param {Object} ctx Loaded context (with parsed args).
 */
export function runTemplates( ctx ) {
	const inventory = JSON.parse(
		wpEval( ctx, TEMPLATE_INVENTORY_EVAL ) || '[]'
	);

	if ( inventory.length === 0 ) {
		info( 'no custom templates or template parts found' );
		return;
	}

	const folders = JSON.parse( wpEval( ctx, THEME_FOLDERS_EVAL ) || '{}' );
	info( `found ${ inventory.length } custom template artifact(s)` );

	if ( ctx.dryRun ) {
		const inspectDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'wtc-templates-' )
		);
		try {
			for ( const template of inventory ) {
				const { type, id, wp_id: recordId, slug } = template;
				assertSafeSlug( slug );
				const folder = folders[ type ];
				const sourcePath = path.join(
					inspectDir,
					`${ type }-${ slug }.source.html`
				);
				const outputPath = path.join(
					inspectDir,
					`${ type }-${ slug }.output.html`
				);
				const reportPath = path.join(
					inspectDir,
					`${ type }-${ slug }.report.json`
				);
				fs.writeFileSync(
					sourcePath,
					exportTemplate( ctx, id, type, recordId )
				);
				rewriteRuntimeUrls( ctx, sourcePath, outputPath, reportPath );
				const runtimeCount = JSON.parse(
					fs.readFileSync( reportPath, 'utf8' )
				).total;
				const target = path.join(
					ctx.themeDir,
					folder,
					`${ slug }.html`
				);
				if ( runtimeCount > 0 ) {
					const patternTarget = path.join(
						ctx.themeDir,
						'patterns',
						`${ runtimePatternSlug( type, slug ) }.php`
					);
					const state =
						fs.existsSync( patternTarget ) &&
						! runtimePatternIsManaged( patternTarget, type, slug )
							? 'COLLISION'
							: 'runtime pattern';
					info(
						`would write ${ target } and ${ patternTarget } from ${ recordId } (${ runtimeCount } runtime URL(s); ${ state })`
					);
				} else {
					info( `would write ${ target } from ${ recordId }` );
				}
			}
		} finally {
			fs.rmSync( inspectDir, { recursive: true, force: true } );
		}
		return;
	}

	createRun( ctx, 'templates' );

	const installPlan = [];
	for ( const template of inventory ) {
		const { type, id, wp_id: recordId, slug } = template;
		assertSafeSlug( slug );
		const folder = folders[ type ];
		if ( ! folder || folder.startsWith( '/' ) || folder.includes( '..' ) ) {
			die( `unsafe template folder returned by WordPress: ${ folder }` );
		}

		const sourcePath = path.join(
			ctx.runDir,
			'staging',
			`${ type }-${ slug }.source.html`
		);
		const bodyPath = path.join(
			ctx.runDir,
			'staging',
			`${ type }-${ slug }.body.html`
		);
		const reportPath = path.join(
			ctx.runDir,
			'staging',
			`${ type }-${ slug }.report.json`
		);
		const templateStage = path.join(
			ctx.runDir,
			'staging',
			`${ type }-${ slug }.html`
		);
		const templateTarget = path.join(
			ctx.themeDir,
			folder,
			`${ slug }.html`
		);

		fs.writeFileSync(
			sourcePath,
			exportTemplate( ctx, id, type, recordId )
		);
		if ( ! fs.statSync( sourcePath ).size ) {
			die( `empty export for ${ id }` );
		}
		rewriteRuntimeUrls( ctx, sourcePath, bodyPath, reportPath );
		const runtimeCount = JSON.parse(
			fs.readFileSync( reportPath, 'utf8' )
		).total;

		let patternStage = null;
		let patternTarget = null;
		let runtimeSlug = null;

		if ( runtimeCount > 0 ) {
			runtimeSlug = runtimePatternSlug( type, slug );
			patternStage = path.join(
				ctx.runDir,
				'staging',
				`${ runtimeSlug }.php`
			);
			patternTarget = path.join(
				ctx.themeDir,
				'patterns',
				`${ runtimeSlug }.php`
			);
			if (
				fs.existsSync( patternTarget ) &&
				! runtimePatternIsManaged( patternTarget, type, slug ) &&
				! ctx.force
			) {
				die(
					`runtime pattern file already exists: ${ patternTarget } (rerun with --force to back it up and replace it)`
				);
			}
			fs.writeFileSync(
				patternStage,
				buildPatternFile( {
					title: slug,
					slug: `${ ctx.themeSlug }/${ runtimeSlug }`,
					categories: '',
					inserter: 'no',
					description: runtimePatternDescription( type, slug ),
					body: fs.readFileSync( bodyPath, 'utf8' ),
				} )
			);
			fs.writeFileSync(
				templateStage,
				`<!-- wp:pattern {"slug":"${ ctx.themeSlug }/${ runtimeSlug }"} /-->\n`
			);
		} else {
			fs.copyFileSync( bodyPath, templateStage );
		}

		installPlan.push( {
			type,
			recordId,
			slug,
			templateStage,
			templateTarget,
			patternStage,
			patternTarget,
			runtimeSlug,
			runtimeCount,
		} );
	}

	let runtimePatternsWritten = false;
	for ( const row of installPlan ) {
		if ( row.runtimeCount > 0 ) {
			installFile( ctx, row.patternStage, row.patternTarget );
			manifestAdd(
				ctx,
				'runtime_pattern',
				row.recordId,
				row.runtimeSlug,
				row.patternTarget
			);
			info(
				`generated runtime pattern -> ${ row.patternTarget } (${ row.runtimeCount } local URL(s))`
			);
			runtimePatternsWritten = true;
		}
		installFile( ctx, row.templateStage, row.templateTarget );
		manifestAdd(
			ctx,
			row.type,
			row.recordId,
			row.slug,
			row.templateTarget
		);
		info(
			`exported ${ row.type } ${ row.recordId } -> ${ row.templateTarget }`
		);
	}

	if ( runtimePatternsWritten ) {
		wpEval( ctx, CLEAR_PATTERN_CACHE_EVAL );
		info( 'cleared the theme pattern file cache' );
	}

	finishRun( ctx );

	if ( ctx.clean ) {
		runClean( ctx, ctx.manifest );
	}
}

const EXPORT_FALLBACK_NOTICE =
	'wp block template export not available (needs WP-CLI 3.0 / wp-cli/block-command) — falling back to reading the template post content directly';

/**
 * Exports one template's markup. Prefers `wp block template export`
 * (WP-CLI 3.0 / wp-cli/block-command); on WP-CLI 2.x — where the `block`
 * command group does not exist — falls back to reading the underlying
 * template post's post_content (what the 3.0 export prints). Any other
 * export failure is fatal.
 *
 * @param {Object} ctx  Loaded context.
 * @param {string} id   Template id (theme//slug).
 * @param {string} type wp_template | wp_template_part.
 * @param {number} wpId Underlying post ID from the inventory.
 * @return {string} Exported markup.
 */
export function exportTemplate( ctx, id, type, wpId ) {
	const result = wpTry( ctx, [
		'block',
		'template',
		'export',
		id,
		`--type=${ type }`,
		'--stdout',
	] );

	if ( result.ok ) {
		return result.stdout;
	}

	const commandMissing =
		/not a registered/i.test( result.stderr ) ||
		/no such file or directory/i.test( result.stderr );

	if ( ! commandMissing ) {
		die(
			`template export failed: ${
				result.stderr.trim() || 'unknown error'
			}`
		);
	}

	info( EXPORT_FALLBACK_NOTICE );

	const content = wp(
		ctx,
		[ 'post', 'get', String( wpId ), '--field=post_content' ],
		{ capture: true }
	);

	if ( ! content.trim() ) {
		die( `empty export for ${ id }` );
	}

	return content;
}
