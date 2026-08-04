import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as securityPatterns from '../../theme-review/checks/security-patterns.js';

describe('Security Patterns Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a clean theme', () => {
		const findings = securityPatterns.run(
			path.join(fixturesPath, 'good-theme'),
			'good-theme'
		);
		expect(findings).toHaveLength(0);
	});

	it('fails when eval or base64 decode are used', () => {
		const findings = securityPatterns.run(
			path.join(fixturesPath, 'bad-security'),
			'bad-security'
		);
		expect(findings.length).toBeGreaterThan(0);

		expect(findings.some((f) => f.id === 'security.eval')).toBe(true);
		expect(findings.some((f) => f.id === 'security.base64_decode')).toBe(
			true
		);
	});
});
