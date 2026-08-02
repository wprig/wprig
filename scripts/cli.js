#!/usr/bin/env node
/**
 * WP Rig CLI
 * Modularized version of the previous monolithic cli.js.
 */
import { Command } from 'commander';
import config from '../config/themeConfig.js';
import generateCert from './tasks/generateCert.js';
import testComponent from './tasks/testComponent.js';
import runBuild from './tasks/build.js';
import runBundle from './tasks/bundle.js';
import runBundleWporg from './tasks/bundleWporg.js';
import runDev from './tasks/dev.js';
import runInit from './tasks/init.js';
import runBlockValidation from './tasks/validateBlocks.js';
import { runTask } from './lib/cli-utils.js';

const program = new Command();

program
	.name('wprig')
	.description('WP Rig Node-based build CLI (no gulp)')
	.version('0.1.0');

program
	.command('build')
	.description('Build the theme for development or CI')
	.option('--phpcs', 'Run PHP CodeSniffer')
	.option('--lint', 'Run JS and CSS linters')
	.option('--dev', 'Use development mode for asset builders')
	.action(async (opts) => {
		try {
			await runBuild({
				phpcs: !!opts.phpcs,
				lint: !!opts.lint,
				dev: !!opts.dev,
			});
			console.log('Build completed.');
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('bundle')
	.description('Bundle the theme for production')
	.option('--phpcs', 'Run PHP CodeSniffer')
	.option('--lint', 'Run JS and CSS linters')
	.action(async (opts) => {
		try {
			await runBundle({
				phpcs: !!opts.phpcs,
				lint: !!opts.lint,
			});
			console.log('Bundle completed.');
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('bundle:wporg')
	.description('Build, audit, and zip the theme for WordPress.org directory submission')
	.option('--skip-audit', 'Skip the strict theme-review static audit (Not recommended)')
	.action(async (opts) => {
		try {
			await runBundleWporg({
				skipAudit: !!opts.skipAudit,
			});
			console.log('WordPress.org Bundle completed.');
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('dev')
	.description('Start development server with live reload (no gulp)')
	.option('--lint', 'Run JS and CSS linters before starting')
	.action(async (opts) => {
		try {
			await runDev(opts);
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('test:component <slug>')
	.description('Validate a component for registry readiness')
	.action(async (slug) => {
		try {
			const themeRoot = process.cwd();
			await testComponent(themeRoot, slug);
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('generateCert')
	.description('Generate Certificate')
	.action(async () => {
		try {
			await runTask(generateCert, 'generateCert');
			console.log('Cert Generated');
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('get-dev-url')
	.description('Get the local development URL from config')
	.action(() => {
		try {
			console.log(config.dev.browserSync.proxyURL);
		} catch (e) {
			console.error('Could not find proxyURL in config');
			process.exitCode = 1;
		}
	});

program
	.command('init')
	.description('Post-install setup: create config.json and guide next steps')
	.option('--non-interactive', 'Skip prompts and use defaults/placeholders')
	.action(async (opts) => {
		try {
			await runInit(opts);
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program
	.command('lint:blocks')
	.description(
		'Validate all theme FSE block templates against Gutenberg schema definitions'
	)
	.action(async () => {
		try {
			const success = await runBlockValidation();
			if (!success) {
				process.exitCode = 1;
			}
		} catch (e) {
			console.error(e?.message || e);
			process.exitCode = 1;
		}
	});

program.parse(process.argv);
