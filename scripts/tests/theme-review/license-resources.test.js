import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as licenseResources from '../../theme-review/checks/license-resources.js';

describe('License and Resources Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a theme with no vendor assets', () => {
		const findings = licenseResources.run(
			path.join(fixturesPath, 'good-theme'),
			'good-theme'
		);
		const requiredOrWarning = findings.filter((f) =>
			['REQUIRED', 'WARNING'].includes(f.severity)
		);
		expect(requiredOrWarning).toHaveLength(0);
	});

	it('warns when vendor assets exist but no Resources section in readme', () => {
		const findings = licenseResources.run(
			path.join(fixturesPath, 'license-bad'),
			'license-bad'
		);

		const missingResources = findings.find(
			(f) => f.id === 'license.missing-resources-section'
		);
		expect(missingResources).toBeDefined();
		expect(missingResources.severity).toBe('WARNING');

		const missingLicense = findings.find(
			(f) => f.id === 'license.readme-missing-license'
		);
		expect(missingLicense).toBeDefined();
	});
});
