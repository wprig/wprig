import path from 'path';
import fs from 'fs';
import { generateJsonReport, generateMarkdownReport } from './reporters.js';

// Check modules
import * as metadata from './checks/metadata.js';
import * as bannedFiles from './checks/banned-files.js';
import * as pluginTerritory from './checks/plugin-territory.js';
import * as securityPatterns from './checks/security-patterns.js';
import * as remoteResources from './checks/remote-resources.js';
import * as themeCheck from './checks/theme-check.js';
import * as performanceHooks from './checks/performance-hooks.js';

import * as i18nBasic from './checks/i18n-basic.js';
import * as licenseResources from './checks/license-resources.js';
import * as themeJson from './checks/theme-json.js';
import * as htmlTemplates from './checks/html-templates.js';

const ALL_CHECKS = {
	metadata,
	'banned-files': bannedFiles,
	'plugin-territory': pluginTerritory,
	'security-patterns': securityPatterns,
	'remote-resources': remoteResources,
	'theme-check': themeCheck,
	'performance-hooks': performanceHooks,
	'i18n-basic': i18nBasic,
	'license-resources': licenseResources,
	'theme-json': themeJson,
	'html-templates': htmlTemplates,
};

async function main() {
	const args = process.argv.slice(2);
	let themePath = process.cwd();
	let format = 'both';
	let failOn = 'required';
	let checkToRun = 'all';
	let allowBlocks = false;

	args.forEach((arg) => {
		if (arg.startsWith('--path=')) {
			themePath = path.resolve(arg.split('=')[1]);
		}
		if (arg.startsWith('--format=')) {
			format = arg.split('=')[1];
		}
		if (arg.startsWith('--fail-on=')) {
			failOn = arg.split('=')[1];
		}
		if (arg.startsWith('--check=')) {
			checkToRun = arg.split('=')[1];
		}
		if (arg === '--allow-blocks') {
			allowBlocks = true;
		}
	});

	const themeSlug = path.basename(themePath);

	if (!fs.existsSync(themePath)) {
		console.error(`Error: Theme path does not exist: ${themePath}`);
		process.exit(2);
	}

	const checks =
		checkToRun === 'all'
			? Object.values(ALL_CHECKS)
			: [ALL_CHECKS[checkToRun]];

	if (checks.includes(undefined)) {
		console.error(`Error: Invalid check specified: ${checkToRun}`);
		process.exit(2);
	}

	console.log(`Auditing theme: ${themeSlug}`);
	console.log(`Path: ${themePath}`);
	if (checkToRun !== 'all') {
		console.log(`Running specific check: ${checkToRun}`);
	}
	console.log('---');

	let allFindings = [];

	for (const check of checks) {
		try {
			const results = await check.run(themePath, themeSlug, {
				allowBlocks,
			});
			if (Array.isArray(results)) {
				allFindings = allFindings.concat(results);
			}
		} catch (err) {
			console.error(`Error running check:`, err);
		}
	}

	const summary = { required: 0, warning: 0, recommended: 0, info: 0 };
	allFindings.forEach((f) => {
		if (summary[f.severity.toLowerCase()] !== undefined) {
			summary[f.severity.toLowerCase()]++;
		}
	});

	const report = {
		generatedAt: new Date().toISOString(),
		themePath,
		themeSlug,
		summary,
		findings: allFindings,
	};

	const artifactsDir = path.join(process.cwd(), 'artifacts', 'theme-review');
	if (!fs.existsSync(artifactsDir)) {
		fs.mkdirSync(artifactsDir, { recursive: true });
	}

	if (format === 'json' || format === 'both') {
		generateJsonReport(report, path.join(artifactsDir, 'report.json'));
		console.log(`JSON report saved to artifacts/theme-review/report.json`);
	}

	if (format === 'md' || format === 'both') {
		generateMarkdownReport(report, path.join(artifactsDir, 'report.md'));
		console.log(
			`Markdown report saved to artifacts/theme-review/report.md`
		);
	}

	console.log(`\nAudit Complete.`);
	console.log(
		`REQUIRED: ${summary.required} | WARNING: ${summary.warning} | RECOMMENDED: ${summary.recommended} | INFO: ${summary.info}`
	);

	let shouldFail = false;
	if (failOn === 'required' && summary.required > 0) {
		shouldFail = true;
	} else if (
		failOn === 'warning' &&
		(summary.required > 0 || summary.warning > 0)
	) {
		shouldFail = true;
	}

	if (shouldFail) {
		console.error(
			`\nFAILED: Theme review audit detected ${failOn} findings.`
		);
		process.exit(1);
	}

	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(2);
});
