#!/usr/bin/env node
/**
 * WP-CLI Gutenberg Bridge Node.js Runner
 *
 * Handles environment detection (Local vs. Studio), prepares JSON inputs,
 * executes PHP scripts via WP-CLI, and processes structured outputs.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const themeRoot = process.cwd();
const bridgePhpPath = path.resolve(themeRoot, 'scripts/lib/gutenberg-bridge.php');
const artifactsDir = path.resolve(themeRoot, 'artifacts');

// Ensure artifacts directory exists
if (!fs.existsSync(artifactsDir)) {
	fs.mkdirSync(artifactsDir, { recursive: true });
}

// Helper to auto-detect active Local site database socket based on path mapping
function detectLocalSocket() {
	const homeDir = os.homedir();
	const themeRoot = process.cwd();
	
	// Check standard Local sites run paths on Darwin/Linux
	const runDirs = [
		path.join(homeDir, 'Library/Application Support/Local/run'),
		path.join(homeDir, '.config/Local/run')
	];

	for (const runDir of runDirs) {
		if (!fs.existsSync(runDir)) continue;

		try {
			const items = fs.readdirSync(runDir);
			for (const item of items) {
				const siteDir = path.join(runDir, item);
				const socketPath = path.join(siteDir, 'mysql/mysqld.sock');
				if (!fs.existsSync(socketPath)) continue;

				// Verify this site matches current project workspace path
				const nginxConf = path.join(siteDir, 'conf/nginx/site.conf');
				const phpIni = path.join(siteDir, 'conf/php/php.ini');
				
				let matches = false;
				// Theme is typically placed at: site-root/app/public/wp-content/themes/...
				// We expect the site's nginx/php config to reference the site-root
				const rootToSearch = path.dirname(path.dirname(path.dirname(themeRoot))); // site-root/app/public

				if (fs.existsSync(nginxConf)) {
					const content = fs.readFileSync(nginxConf, 'utf-8');
					if (content.includes(rootToSearch)) {
						matches = true;
					}
				} else if (fs.existsSync(phpIni)) {
					const content = fs.readFileSync(phpIni, 'utf-8');
					if (content.includes(rootToSearch)) {
						matches = true;
					}
				}

				if (matches) {
					return socketPath;
				}
			}
		} catch (e) {
			// Fail-silent, standard fallback to basic WP-CLI
		}
	}
	return null;
}

// 1. Environment Detection
function detectEnvironment() {
	const homeDir = process.env.HOME || '';

	// Support explicit override via environment variable (e.g. WP_CLI_PATH=~/Studio/wp-rig-demo-1)
	if (process.env.WP_CLI_PATH) {
		const sitePath = path.resolve(process.env.WP_CLI_PATH.replace(/^~/, homeDir));
		console.log(`📡 Forcing WordPress Studio environment at: ${sitePath}`);
		return { command: 'studio', baseArgs: ['wp', '--path', sitePath] };
	}

	let command = 'wp';
	let baseArgs = [];

	// Support local environment socket overrides (either explicitly via env or auto-detected for Local site)
	const envSocket = process.env.WP_CLI_SOCKET;
	const localSocket = envSocket || detectLocalSocket();

	if (localSocket && fs.existsSync(localSocket)) {
		let wpExecutable = 'wp';
		try {
			const wpPath = execSync('which wp 2>/dev/null', { encoding: 'utf-8' }).trim();
			if (wpPath) {
				wpExecutable = wpPath;
			}
		} catch (e) {}

		command = 'php';
		baseArgs = [
			'-d', `mysqli.default_socket=${localSocket}`,
			'-d', `pdo_mysql.default_socket=${localSocket}`,
			wpExecutable
		];
		console.log(`📡 Auto-routed WP-CLI via php using database socket: ${localSocket}`);
	}

	try {
		// Run studio site list to see if we are operating inside a Studio site
		const studioListOutput = execSync('studio site list --format=json 2>/dev/null || studio site list 2>/dev/null', { encoding: 'utf-8' });
		
		// Parse site list to see if any site contains our themeRoot
		if (studioListOutput) {
			const lines = studioListOutput.split('\n');
			for (const line of lines) {
				const match = line.match(/(~\/[^\s|]+|\/[^\s|]+)/);
				if (match) {
					let sitePath = match[1].replace(/^~/, homeDir);
					if (themeRoot.startsWith(sitePath)) {
						console.log(`📡 Detected WordPress Studio environment at: ${sitePath}`);
						command = 'studio';
						baseArgs = ['wp', '--path', sitePath];
						return { command, baseArgs };
					}
				}
			}
		}
	} catch (e) {
		// studio not available or failed
	}

	console.log('📡 Defaulting to standard Local WP-CLI execution');
	return { command, baseArgs };
}

// 2. Run WP-CLI Command with stdin support
function runWpCli(action, jsonPayload = '') {
	return new Promise((resolve, reject) => {
		const { command, baseArgs } = detectEnvironment();
		
		// Structure: [baseArgs] eval-file [bridgePhpPath] -- [action]
		const args = [...baseArgs, 'eval-file', bridgePhpPath, '--', action];

		console.log(`🚀 Executing: ${command} ${args.join(' ')}`);

		const child = spawn(command, args);

		let stdout = '';
		let stderr = '';

		if (child.stdin && jsonPayload) {
			child.stdin.write(jsonPayload);
			child.stdin.end();
		}

		child.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		child.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		child.on('close', (code) => {
			// Strip any terminal escape codes or auto-update banners that Studio prepends
			let cleanStdout = stdout;
			if (command === 'studio') {
				cleanStdout = stdout.replace(/╭─[\s\S]*?─╯\r?\n?/g, '').trim();
			} else {
				cleanStdout = stdout.trim();
			}

			if (code !== 0) {
				reject(new Error(`WP-CLI execution failed (Exit Code ${code}):\n${stderr || cleanStdout}`));
				return;
			}

			resolve(cleanStdout);
		});

		child.on('error', (err) => {
			reject(err);
		});
	});
}

// 3. Command dispatcher
async function main() {
	const args = process.argv.slice(2);
	const action = args[0] || 'compile';

	try {
		if (action === 'schema') {
			console.log('Fetching active WordPress block schemas...');
			const result = await runWpCli('schema');
			const schemaPath = path.resolve(artifactsDir, 'blocks-schema.json');
			
			// Verify it's valid JSON before saving
			JSON.parse(result);
			fs.writeFileSync(schemaPath, JSON.stringify(JSON.parse(result), null, 2));
			console.log(`✅ Saved block schemas to: ${schemaPath}`);
			
		} else if (action === 'settings') {
			console.log('Fetching theme settings configuration...');
			const result = await runWpCli('settings');
			const settingsPath = path.resolve(artifactsDir, 'theme-settings.json');
			
			// Verify it's valid JSON before saving
			JSON.parse(result);
			fs.writeFileSync(settingsPath, JSON.stringify(JSON.parse(result), null, 2));
			console.log(`✅ Saved theme settings to: ${settingsPath}`);
			
		} else if (action === 'compile') {
			const irFilePath = args[1];
			if (!irFilePath) {
				console.error('❌ Error: Please specify the path to a JSON IR file.\nUsage: npm run block:compile <path_to_json>');
				process.exit(1);
			}

			const absoluteIrPath = path.resolve(themeRoot, irFilePath);
			if (!fs.existsSync(absoluteIrPath)) {
				console.error(`❌ Error: JSON IR file not found at: ${absoluteIrPath}`);
				process.exit(1);
			}

			console.log(`Reading IR file: ${absoluteIrPath}`);
			const irContent = fs.readFileSync(absoluteIrPath, 'utf-8');

			console.log('Compiling IR to perfect Gutenberg block HTML...');
			const result = await runWpCli('compile', irContent);
			
			const parsed = JSON.parse(result);
			if (parsed.is_valid) {
				console.log('\n=== 🎉 COMPILATION SUCCESSFUL ===');
				console.log(parsed.markup);
				console.log('=================================');
			} else {
				console.error('\n=== ❌ COMPILATION FAILED ===');
				parsed.errors.forEach(err => console.error(`- Error: ${err}`));
				if (parsed.warnings && parsed.warnings.length > 0) {
					parsed.warnings.forEach(warn => console.warn(`- Warning: ${warn}`));
				}
				process.exitCode = 1;
			}
		} else {
			console.error(`❌ Unknown action: ${action}\nAvailable actions: schema, settings, compile`);
			process.exit(1);
		}
	} catch (e) {
		console.error(`❌ Bridge Execution Error:\n${e.message || e}`);
		process.exit(1);
	}
}

main();
