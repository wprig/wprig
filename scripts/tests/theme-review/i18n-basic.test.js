import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as i18nBasic from '../../theme-review/checks/i18n-basic.js';

describe('i18n Basic Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a clean theme with matching domain', () => {
		const findings = i18nBasic.run(
			path.join(fixturesPath, 'i18n-good'),
			'i18n-good'
		);
		const required = findings.filter((f) => f.severity === 'REQUIRED');
		expect(required).toHaveLength(0);
	});

	it('fails when wrong domain is used', () => {
		const findings = i18nBasic.run(
			path.join(fixturesPath, 'i18n-bad'),
			'i18n-bad'
		);
		const wrongDomain = findings.find((f) => f.id === 'i18n.wrong-domain');
		expect(wrongDomain).toBeDefined();
		expect(wrongDomain.severity).toBe('REQUIRED');
	});

	it('fails when domain is missing', () => {
		const findings = i18nBasic.run(
			path.join(fixturesPath, 'i18n-bad'),
			'i18n-bad'
		);
		const missingDomain = findings.find(
			(f) => f.id === 'i18n.missing-domain'
		);
		expect(missingDomain).toBeDefined();
		expect(missingDomain.severity).toBe('REQUIRED');
	});
});
