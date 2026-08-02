import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import * as pluginTerritory from '../../theme-review/checks/plugin-territory.js';

describe('Plugin Territory Check', () => {
	const fixturesPath = path.join(__dirname, 'fixtures');

	it('passes a clean theme', () => {
		const findings = pluginTerritory.run(
			path.join(fixturesPath, 'good-theme'),
			'good-theme',
			{ allowBlocks: false }
		);
		expect(findings).toHaveLength(0);
	});

	it('fails when CPTs or blocks are registered', () => {
		const findings = pluginTerritory.run(
			path.join(fixturesPath, 'plugin-territory'),
			'plugin-territory',
			{ allowBlocks: false }
		);
		expect(findings.length).toBeGreaterThan(0);

		expect(findings.some((f) => f.id === 'plugin-territory.cpt')).toBe(
			true
		);
		expect(findings.some((f) => f.id === 'plugin-territory.blocks')).toBe(
			true
		);
	});

	it('allows blocks if allowBlocks is true', () => {
		const findings = pluginTerritory.run(
			path.join(fixturesPath, 'plugin-territory'),
			'plugin-territory',
			{ allowBlocks: true }
		);
		const blockFinding = findings.find(
			(f) => f.id === 'plugin-territory.blocks'
		);

		expect(blockFinding).toBeDefined();
		expect(blockFinding.severity).toBe('WARNING'); // Degraded to WARNING
	});
});
