import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as remoteResources from '../../theme-review/checks/remote-resources.js';

describe('Remote Resources Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a clean theme', () => {
		const findings = remoteResources.run(
			path.join(fixturesPath, 'good-theme'),
			'good-theme'
		);
		expect(findings).toHaveLength(0);
	});

	it('fails when external CDNs are used, but warns on Google Fonts', () => {
		const findings = remoteResources.run(
			path.join(fixturesPath, 'cdn-theme'),
			'cdn-theme'
		);

		const cdnjs = findings.find((f) => f.message.includes('cdnjs'));
		expect(cdnjs).toBeDefined();
		expect(cdnjs.severity).toBe('REQUIRED');

		const fonts = findings.find(
			(f) => f.id === 'remote-resources.google-fonts'
		);
		expect(fonts).toBeDefined();
		expect(fonts.severity).toBe('INFO');
	});
});
