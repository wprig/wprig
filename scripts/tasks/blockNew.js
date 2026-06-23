import fse from 'fs-extra';
import path from 'node:path';
import {
	cleanupCreateBlockArtifacts,
	ensureBlocksRoot,
	execCreateBlock,
	parseName,
	pathExists,
	root,
	blocksRoot,
} from '../lib/block-utils.js';
import themeConfig from '../../config/themeConfig.js';

/**
 * Creates a minimal block.json file if create-block didn't.
 *
 * @param {string} dir     Block directory
 * @param {Object} options Block options
 */
async function createMinimalBlockJson( dir, options ) {
	const raw = {
		name: `${ options.namespace }/${ options.slug }`,
		apiVersion: 2,
		title: options.title
			? options.title
					.replace( /&quot;/g, '"' )
					.replace( /&amp;/g, '&' )
					.replace( /&lt;/g, '<' )
					.replace( /&gt;/g, '>' )
					.replace( /&#39;/g, "'" )
			: options.slug
					.replace( /[-_]/g, ' ' )
					.replace( /\b\w/g, ( m ) => m.toUpperCase() ),
		category: options.category || 'widgets',
		icon: options.icon || 'block-default',
		description: options.description || '',
		textdomain: themeConfig?.theme?.slug || 'wp-rig',
		editorScript: 'file:./build/index.js',
	};
	if ( options.view ) {
		raw.script = 'file:./build/view.js';
	}
	if ( options.styleFlag ) {
		raw.style = 'file:./build/style.css';
	}
	if ( options.editorStyleFlag ) {
		raw.editorStyle = 'file:./build/editor.css';
	}
	if ( options.keywords ) {
		raw.keywords = options.keywords
			.split( ',' )
			.map( ( s ) => s.trim() )
			.filter( Boolean );
	}
	if ( options.dynamic ) {
		raw.render = 'file:./render.php';
	}
	raw.supports = { spacing: true, color: { text: true, background: true } };
	await fse.writeJSON( path.join( dir, 'block.json' ), raw, { spaces: 2 } );
}

/**
 * Adjusts block.json after create-block and templates are applied.
 *
 * @param {string} dir     Block directory
 * @param {Object} options Block options
 */
async function adjustBlockJson( dir, options ) {
	const blockJsonPath = path.join( dir, 'block.json' );
	if ( ! pathExists( blockJsonPath ) ) {
		return;
	}
	const raw = await fse.readJSON( blockJsonPath );
	raw.name = `${ options.namespace }/${ options.slug }`;
	if ( options.title ) {
		raw.title = options.title
			.replace( /&quot;/g, '"' )
			.replace( /&amp;/g, '&' )
			.replace( /&lt;/g, '<' )
			.replace( /&gt;/g, '>' )
			.replace( /&#39;/g, "'" );
	}
	raw.category = options.category || raw.category || 'widgets';
	if ( options.icon ) {
		raw.icon = options.icon;
	}
	if ( options.description ) {
		raw.description = options.description;
	}
	if ( options.keywords ) {
		raw.keywords = options.keywords
			.split( ',' )
			.map( ( s ) => s.trim() )
			.filter( Boolean );
	}
	raw.textdomain = themeConfig?.theme?.slug || 'wp-rig';
	raw.editorScript = 'file:./build/index.js';
	if ( options.view ) {
		raw.script = 'file:./build/view.js';
	}
	if ( options.styleFlag ) {
		raw.style = 'file:./build/style.css';
	}
	if ( options.editorStyleFlag ) {
		raw.editorStyle = 'file:./build/editor.css';
	}

	raw.supports = raw.supports || {
		spacing: true,
		color: { text: true, background: true },
		__experimentalBorder: false,
	};

	if ( options.dynamic ) {
		raw.render = 'file:./render.php';
	} else if ( raw.render ) {
		delete raw.render;
	}

	await fse.writeJSON( blockJsonPath, raw, { spaces: 2 } );
}

/**
 * Writes block templates to the block directory.
 *
 * @param {string} dir  Block directory
 * @param {Object} opts Options
 */
async function writeTemplates( dir, opts ) {
	const srcDir = path.join( dir, 'src' );
	await fse.ensureDir( srcDir );
	const ext = opts.ts ? 'tsx' : 'js';
	let idx = await fse.readFile(
		path.join(
			root,
			'scripts',
			'templates',
			'block',
			opts.ts ? 'index.tsx' : 'index.js'
		),
		'utf8'
	);
	let editTemplate;
	if ( opts.dynamic ) {
		editTemplate = opts.ts ? 'edit.dynamic.tsx' : 'edit.dynamic.js';
	} else {
		editTemplate = opts.ts ? 'edit.tsx' : 'edit.js';
	}

	const edit = await fse.readFile(
		path.join( root, 'scripts', 'templates', 'block', editTemplate ),
		'utf8'
	);
	const fullName = `${ opts.namespace }/${ opts.slug }`;
	idx = idx.replace( /wprig\/example/g, fullName );
	if ( opts.title ) {
		idx = idx.replace( /Example Block/g, opts.title );
	}
	await fse.writeFile( path.join( srcDir, `index.${ ext }` ), idx );
	await fse.writeFile( path.join( srcDir, `edit.${ ext }` ), edit );
	if ( opts.dynamic ) {
		const render = await fse.readFile(
			path.join( root, 'scripts', 'templates', 'block', 'render.php' ),
			'utf8'
		);
		await fse.writeFile( path.join( dir, 'render.php' ), render );
	}
	if ( opts.styleFlag && ! pathExists( path.join( dir, 'style.css' ) ) ) {
		const style = await fse.readFile(
			path.join( root, 'scripts', 'templates', 'block', 'style.css' ),
			'utf8'
		);
		await fse.writeFile( path.join( dir, 'style.css' ), style );
	}
	if (
		opts.editorStyleFlag &&
		! pathExists( path.join( dir, 'editor.css' ) )
	) {
		const estyle = await fse.readFile(
			path.join( root, 'scripts', 'templates', 'block', 'editor.css' ),
			'utf8'
		);
		await fse.writeFile( path.join( dir, 'editor.css' ), estyle );
	}
	if ( ! pathExists( path.join( dir, 'jest.config.cjs' ) ) ) {
		const jestCfg = await fse.readFile(
			path.join(
				root,
				'scripts',
				'templates',
				'block',
				'jest.config.cjs'
			),
			'utf8'
		);
		await fse.writeFile( path.join( dir, 'jest.config.cjs' ), jestCfg );
	}
	if (
		! pathExists(
			path.join( dir, 'src', `index.test.${ opts.ts ? 'ts' : 'js' }` )
		)
	) {
		const testTemplate = opts.ts ? 'index.test.ts' : 'index.test.js';
		const testTpl = await fse.readFile(
			path.join( root, 'scripts', 'templates', 'block', testTemplate ),
			'utf8'
		);
		await fse.writeFile(
			path.join( srcDir, `index.test.${ opts.ts ? 'ts' : 'js' }` ),
			testTpl
		);
	}
}

/**
 * Command implementation for block:new.
 *
 * @param {string} name    Block name
 * @param {Object} options Command options
 */
export default async function cmdNew( name, options ) {
	ensureBlocksRoot();
	const { namespace, slug, full } = parseName( name );
	const dest = path.join( blocksRoot, slug );
	if ( pathExists( dest ) ) {
		console.error( `Block directory already exists: ${ dest }` );
		process.exit( 1 );
	}
	await fse.ensureDir( dest );

	const cbArgs = [
		`${ namespace }/${ slug }`,
		'--no-plugin',
		...( options.dynamic ? [ '--variant', 'dynamic' ] : [] ),
	];

	try {
		await execCreateBlock( dest, cbArgs );
	} catch ( e ) {
		console.warn(
			'[warn] @wordpress/create-block failed or not present, proceeding with WP Rig templates only.'
		);
	}

	await cleanupCreateBlockArtifacts( dest );

	const blockJsonPath = path.join( dest, 'block.json' );
	if ( ! pathExists( blockJsonPath ) ) {
		await createMinimalBlockJson( dest, {
			namespace,
			slug,
			title: options.title,
			category: options.category,
			icon: options.icon,
			description: options.description,
			keywords: options.keywords,
			view: !! options.view,
			styleFlag: options.style !== false,
			editorStyleFlag: options.editorStyle !== false,
			dynamic: !! options.dynamic,
		} );
	}

	await writeTemplates( dest, {
		ts: !! options.ts,
		dynamic: !! options.dynamic,
		styleFlag: options.style !== false,
		editorStyleFlag: options.editorStyle !== false,
		namespace,
		slug,
		title: options.title,
	} );

	await adjustBlockJson( dest, {
		namespace,
		slug,
		title: options.title,
		category: options.category,
		icon: options.icon,
		description: options.description,
		keywords: options.keywords,
		view: !! options.view,
		styleFlag: options.style !== false,
		editorStyleFlag: options.editorStyle !== false,
		dynamic: !! options.dynamic,
	} );

	console.log(
		`Created block ${ full } at ${ path.relative( root, dest ) }`
	);
}
