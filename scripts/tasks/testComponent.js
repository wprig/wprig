import fs from 'fs-extra';
import path from 'path';
import c from 'ansi-colors';
import { getAssetPath } from '../lib/utils.js';

/**
 * Validates a component for registry readiness.
 *
 * @param {string} themeRoot     Root directory of the theme
 * @param {string} componentSlug Slug of the component in inc/
 * @return {Promise<boolean>} Success or failure
 */
export default async function testComponent( themeRoot, componentSlug ) {
	const componentDir = path.join( themeRoot, 'inc', componentSlug );

	console.log( c.blue( `Testing component: ${ componentSlug }` ) );

	if ( ! ( await fs.pathExists( componentDir ) ) ) {
		console.error(
			c.red( `Error: Component directory not found at ${ componentDir }` )
		);
		return false;
	}

	const requiredFiles = [
		'Component.php',
		'manifest.json',
		'SPEC.md',
		'SKILL.md',
	];

	let errors = 0;

	for ( const file of requiredFiles ) {
		const filePath = path.join( componentDir, file );
		if ( await fs.pathExists( filePath ) ) {
			console.log( c.green( `✓ ${ file } exists` ) );
		} else {
			console.error( c.red( `✗ ${ file } is missing` ) );
			errors++;
		}
	}

	// Basic manifest validation
	const manifestPath = path.join( componentDir, 'manifest.json' );
	if ( await fs.pathExists( manifestPath ) ) {
		try {
			const manifest = await fs.readJson( manifestPath );
			const requiredFields = [
				'slug',
				'version',
				'title',
				'php_class_mapping',
			];
			for ( const field of requiredFields ) {
				if ( ! manifest[ field ] ) {
					console.error(
						c.red( `✗ manifest.json: missing field "${ field }"` )
					);
					errors++;
				}
			}
		} catch ( e ) {
			console.error(
				c.red( `✗ manifest.json: invalid JSON format (${ e.message })` )
			);
			errors++;
		}
	}

	// Check assets from manifest
	if ( await fs.pathExists( manifestPath ) ) {
		try {
			const manifest = await fs.readJson( manifestPath );
			if ( manifest.asset_mapping ) {
				for ( const type in manifest.asset_mapping ) {
					const asset = manifest.asset_mapping[ type ];
					if ( asset.src ) {
						const assetPath = path.resolve(
							themeRoot,
							getAssetPath( asset.src )
						);
						if ( await fs.pathExists( assetPath ) ) {
							console.log(
								c.green( `✓ Asset ${ asset.src } exists` )
							);
						} else {
							console.error(
								c.red(
									`✗ Asset ${ asset.src } is missing from ${ assetPath }`
								)
							);
							errors++;
						}
					}
				}
			}
		} catch ( e ) {
			// Already handled above
		}
	}

	// Check PHP naming convention
	const phpPath = path.join( componentDir, 'Component.php' );
	if ( await fs.pathExists( phpPath ) ) {
		const content = await fs.readFile( phpPath, 'utf8' );
		const namespaceRegex = /namespace\s+WP_Rig\\WP_Rig\\([A-Za-z0-9_]+);/;
		const match = content.match( namespaceRegex );

		if ( match ) {
			const namespace = match[ 1 ];
			if (
				namespace === componentSlug ||
				namespace.toLowerCase() ===
					componentSlug.replace( /_/g, '' ).toLowerCase()
			) {
				console.log(
					c.green( `✓ Namespace matches (${ namespace })` )
				);
			} else {
				console.warn(
					c.yellow(
						`! Namespace warning: found ${ namespace }, directory is ${ componentSlug }`
					)
				);
			}
		} else {
			console.error(
				c.red(
					`✗ Component.php: could not find valid WP_Rig namespace`
				)
			);
			errors++;
		}

		if ( ! content.includes( 'implements Component_Interface' ) ) {
			console.error(
				c.red(
					'✗ Component.php: class does not implement Component_Interface'
				)
			);
			errors++;
		}

		// Security check: Common dangerous functions
		const dangerousPatterns = [
			{ regex: /eval\s*\(/g, name: 'eval()' },
			{ regex: /base64_decode\s*\(/g, name: 'base64_decode()' },
			{ regex: /shell_exec\s*\(/g, name: 'shell_exec()' },
			{ regex: /exec\s*\(/g, name: 'exec()' },
			{ regex: /passthru\s*\(/g, name: 'passthru()' },
			{ regex: /system\s*\(/g, name: 'system()' },
			{ regex: /popen\s*\(/g, name: 'popen()' },
			{ regex: /proc_open\s*\(/g, name: 'proc_open()' },
		];

		for ( const pattern of dangerousPatterns ) {
			if ( pattern.regex.test( content ) ) {
				console.error(
					c.red(
						`✗ Component.php: Dangerous function detected: ${ pattern.name }`
					)
				);
				errors++;
			}
		}
	}

	if ( errors === 0 ) {
		console.log(
			c.green(
				`\nSUCCESS: Component ${ componentSlug } is registry-ready!`
			)
		);
		return true;
	}
	console.error(
		c.red(
			`\nFAILURE: Component ${ componentSlug } failed validation with ${ errors } errors.`
		)
	);
	return false;
}
