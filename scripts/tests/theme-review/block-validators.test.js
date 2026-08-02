import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as themeJson from '../../theme-review/checks/theme-json.js';
import * as htmlTemplates from '../../theme-review/checks/html-templates.js';

describe('Block Theme Validators', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	describe('Theme JSON', () => {
		it('returns INFO if no theme.json exists', () => {
			const findings = themeJson.run(
				path.join(fixturesPath, 'good-theme'),
				'good-theme'
			);
			expect(findings).toHaveLength(1);
			expect(findings[0].severity).toBe('INFO');
			expect(findings[0].id).toBe('theme-json.missing');
		});

		it('returns REQUIRED on syntax error', () => {
			const findings = themeJson.run(
				path.join(fixturesPath, 'json-bad'),
				'json-bad'
			);
			expect(findings.length).toBeGreaterThan(0);
			expect(findings[0].severity).toBe('REQUIRED');
			expect(findings[0].id).toBe('theme-json.syntax-error');
		});
	});

	describe('HTML Templates', () => {
		it('passes standard block templates', () => {
			const findings = htmlTemplates.run(
				path.join(fixturesPath, 'html-good'),
				'html-good'
			);
			const issues = findings.filter(
				(f) => f.severity === 'REQUIRED' || f.severity === 'WARNING'
			);
			expect(issues).toHaveLength(0);
		});

		it('fails when scripts or hardcoded links exist', () => {
			const findings = htmlTemplates.run(
				path.join(fixturesPath, 'html-bad'),
				'html-bad'
			);

			const hasScript = findings.find(
				(f) => f.id === 'html-templates.enqueued-assets'
			);
			expect(hasScript).toBeDefined();
			expect(hasScript.severity).toBe('REQUIRED');

			const hasUrl = findings.find(
				(f) => f.id === 'html-templates.hardcoded-url'
			);
			expect(hasUrl).toBeDefined();
			expect(hasUrl.severity).toBe('REQUIRED');
		});
	});
});
