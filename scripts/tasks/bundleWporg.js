import config from '../../config/themeConfig.js';
import path from 'path';
import runBundle from './bundle.js';
import childProcess from 'child_process';
import util from 'util';
const execPromise = util.promisify( childProcess.exec );

export default async function runBundleWporg( opts = {} ) {
	console.log( '\n======================================================' );
	console.log( '   WP Rig - WordPress.org Directory Bundle Process    ' );
	console.log( '======================================================\n' );

	// 1. Run the standard bundle process to generate the zip and prod directory
	// Note: We pass wporg: true so the pipeline injects the un-minified source files
	console.log(
		'Bundling theme with un-minified /src directories and package configs included to satisfy TRT review requirements...\n'
	);
	await runBundle( { phpcs: false, lint: false, wporg: true } );

	const prodThemePath = path.join( process.cwd(), '..', config.theme.slug );

	console.log( `\nProd Theme Path: ${ prodThemePath }` );

	// 2. Run the audit if not skipped
	if ( ! opts.skipAudit ) {
		console.log(
			'\nRunning strict WordPress.org Theme Review Audit on the bundled output...\n'
		);
		try {
			// Call the Node.js orchestrator targeting the prod directory
			const auditScriptPath = path.join(
				process.cwd(),
				'scripts',
				'theme-review',
				'run.js'
			);

			// We MUST use Node to execute the ESM file because it might not have +x perms
			const cmd = `node "${ auditScriptPath }" --path="${ prodThemePath }" --fail-on=required --format=both`;

			const { stdout, stderr } = await execPromise( cmd, {
				env: { ...process.env, WPRIG_ALLOW_THEME_BLOCKS: '0' },
			} );

			console.log( stdout );
			if ( stderr ) {
				console.error( stderr );
			}

			console.log(
				'\n✅ Audit Passed! The theme is ready for submission.'
			);
		} catch ( err ) {
			console.log( err.stdout || '' );
			console.error( err.stderr || '' );
			console.error(
				'\n❌ Audit Failed: The bundled theme contains REQUIRED issues that must be fixed before submitting to WordPress.org.'
			);
			console.error(
				'The ZIP file was still generated for inspection, but it is NOT submission-ready.'
			);
			throw new Error( 'WP.org audit failed.' );
		}
	} else {
		console.warn(
			'\n⚠️  WARNING: Strict theme-review audit was SKIPPED. The bundle may not pass WP.org review.'
		);
	}
}
