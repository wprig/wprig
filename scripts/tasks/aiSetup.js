import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import inquirer from 'inquirer';
import colors from 'ansi-colors';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const rootDir = path.resolve( __dirname, '..', '..' );

export const AGENTS = [
	{
		name: 'Claude Code',
		value: 'claude',
		files: [
			{ source: 'AGENTS.md', target: 'CLAUDE.md' },
			{ source: '.aiignore', target: '.claudeignore' },
		],
	},
	{
		name: 'Cursor',
		value: 'cursor',
		files: [
			{ source: 'AGENTS.md', target: '.cursorrules' },
			{ source: '.aiignore', target: '.cursorignore' },
		],
	},
	{
		name: 'Windsurf',
		value: 'windsurf',
		files: [
			{ source: 'AGENTS.md', target: '.windsurfrules' },
			{ source: '.aiignore', target: '.windsurfignore' },
		],
	},
	{
		name: 'Roo Code (Cline)',
		value: 'roo',
		files: [
			{ source: 'AGENTS.md', target: '.clinerules' },
			{ source: '.aiignore', target: '.clineignore' },
		],
	},
	{
		name: 'JetBrains Junie',
		value: 'junie',
		files: [
			{ source: 'AGENTS.md', target: 'JUNIE.md' },
			{ source: '.aiignore', target: '.junieignore' },
		],
	},
	{
		name: 'Gemini CLI',
		value: 'gemini',
		files: [
			{ source: 'AGENTS.md', target: 'GEMINI.md' },
			{ source: '.aiignore', target: '.geminiignore' },
		],
	},
	{
		name: 'GitHub Copilot',
		value: 'copilot',
		files: [
			{ source: 'AGENTS.md', target: '.github/copilot-instructions.md' },
			{ source: '.aiignore', target: '.copilotignore' },
		],
	},
	{
		name: 'Aider',
		value: 'aider',
		files: [
			{ source: 'AGENTS.md', target: '.aider.instructions.md' },
			{ source: '.aiignore', target: '.aiderignore' },
		],
	},
	{
		name: 'OpenCode / OpenHands',
		value: 'opencode',
		files: [
			{ source: 'AGENTS.md', target: 'OPENCODE.md' },
			{ source: 'AGENTS.md', target: '.openhands_instructions' },
			{ source: '.aiignore', target: '.opencodeignore' },
			{ source: '.aiignore', target: '.openhands_ignore' },
		],
	},
	{
		name: 'Mastra',
		value: 'mastra',
		files: [
			{ source: 'AGENTS.md', target: 'MASTRA.md' },
			{ source: '.aiignore', target: '.mastraignore' },
		],
	},
	{
		name: 'PearAI',
		value: 'pearai',
		files: [
			{ source: 'AGENTS.md', target: '.pearrules' },
			{ source: '.aiignore', target: '.pearignore' },
		],
	},
	{
		name: 'Bolt.new / StackBlitz',
		value: 'bolt',
		files: [
			{ source: 'AGENTS.md', target: '.stackblitz_instructions.md' },
			{ source: '.aiignore', target: '.stackblitzignore' },
		],
	},
];

/**
 * Setup AI agents.
 *
 * @param {Object} options Options
 */
export default async function setupAgents( options = {} ) {
	let selectedAgents = [];

	if ( options.all ) {
		selectedAgents = AGENTS.map( ( a ) => a.value );
	} else if ( options.agents ) {
		selectedAgents = options.agents.split( ',' );
	} else {
		const answers = await inquirer.prompt( [
			{
				type: 'checkbox',
				name: 'agents',
				message: 'Select AI agents to optimize for:',
				choices: AGENTS,
			},
		] );
		selectedAgents = answers.agents;
	}

	if ( selectedAgents.length === 0 ) {
		console.log( colors.yellow( 'No agents selected. Exiting.' ) );
		return;
	}

	console.log(
		colors.blue( `Optimizing for: ${ selectedAgents.join( ', ' ) }...` )
	);

	const templateDir = path.resolve( rootDir, '.templates', 'ai' );

	for ( const agentValue of selectedAgents ) {
		const agent = AGENTS.find( ( a ) => a.value === agentValue );
		if ( ! agent ) {
			continue;
		}

		for ( const file of agent.files ) {
			const sourcePath = path.resolve( templateDir, file.source );
			const targetPath = path.resolve( rootDir, file.target );

			// Ensure target directory exists
			const targetDir = path.dirname( targetPath );
			if ( ! fs.existsSync( targetDir ) ) {
				fs.mkdirSync( targetDir, { recursive: true } );
			}

			try {
				if ( fs.existsSync( sourcePath ) ) {
					fs.copyFileSync( sourcePath, targetPath );
					console.log(
						colors.green(
							`✓ Created ${ file.target } for ${ agent.name }`
						)
					);
				} else {
					console.error(
						colors.red(
							`✗ Source file not found: ${ file.source }. Please ensure .templates/ai exists.`
						)
					);
				}
			} catch ( error ) {
				console.error(
					colors.red(
						`✗ Error creating ${ file.target } for ${ agent.name }: ${ error.message }`
					)
				);
			}
		}
	}

	console.log( colors.cyan( '\nAI optimization complete!' ) );
}
