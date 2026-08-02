import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as bannedFiles from '../../theme-review/checks/banned-files.js';

describe('Banned Files Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a clean theme', () => {
		const findings = bannedFiles.run(
			path.join(fixturesPath, 'good-theme'),
			'good-theme'
		);
		expect(findings).toHaveLength(0);
	});

	it('fails when banned files are present', () => {
		const findings = bannedFiles.run(
			path.join(fixturesPath, 'bad-files'),
			'bad-files'
		);
		expect(findings.length).toBeGreaterThan(0);

		const hasGit = findings.some((f) =>
			f.message.includes('Contains .git')
		);
		const hasSql = findings.some((f) =>
			f.message.includes('SQL database dumps')
		);
		const hasDesktopIni = findings.some((f) =>
			f.message.includes('desktop.ini')
		);

		expect(hasGit).toBe(true);
		expect(hasSql).toBe(true);
		expect(hasDesktopIni).toBe(true);
	});
});
