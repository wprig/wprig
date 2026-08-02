/* eslint-env jest */
import fs from 'fs';
import path from 'path';
import os from 'os';
import setupWporg from '../setup-wporg.js';

describe('theme:setup-wporg', () => {
	let tempDir;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wprig-test-'));
		fs.mkdirSync(path.join(tempDir, 'config'));
	});

	afterEach(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it('creates config.json with cleanup_meta_tags: false when starting from default', () => {
		fs.writeFileSync(
			path.join(tempDir, 'config', 'config.default.json'),
			JSON.stringify({
				performance: { cleanup_meta_tags: true },
			})
		);

		setupWporg(tempDir);

		const configPath = path.join(tempDir, 'config', 'config.json');
		expect(fs.existsSync(configPath)).toBe(true);
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		expect(config.performance.cleanup_meta_tags).toBe(false);
	});

	it('updates existing config.json to cleanup_meta_tags: false while retaining other values', () => {
		fs.writeFileSync(
			path.join(tempDir, 'config', 'config.json'),
			JSON.stringify({
				theme: { slug: 'my-theme' },
				performance: { cleanup_meta_tags: true },
			})
		);

		setupWporg(tempDir);

		const configPath = path.join(tempDir, 'config', 'config.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		expect(config.theme.slug).toBe('my-theme');
		expect(config.performance.cleanup_meta_tags).toBe(false);
	});
});
