import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as metadata from '../../theme-review/checks/metadata.js';

describe('Metadata Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a good theme', async () => {
		const findings = await metadata.run(
			path.join(fixturesPath, 'good-theme'),
			'good-theme'
		);

		const requiredFindings = findings.filter(
			(f) => f.severity === 'REQUIRED'
		);
		expect(requiredFindings).toHaveLength(0);
	});

	it('fails when style.css is missing', async () => {
		const findings = await metadata.run(
			path.join(fixturesPath, 'empty-theme'),
			'empty-theme'
		);
		const missingStyle = findings.find(
			(f) => f.id === 'metadata.style-css-missing'
		);
		expect(missingStyle).toBeDefined();
		expect(missingStyle.severity).toBe('REQUIRED');
	});
});
