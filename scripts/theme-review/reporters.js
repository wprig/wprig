import fs from 'fs';

function generateJsonReport(report, outputPath) {
	fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
}

function generateMarkdownReport(report, outputPath) {
	const { summary, findings } = report;
	let md = `# Theme Review Audit Report\n\n`;
	md += `**Theme:** ${report.themeSlug}\n`;
	md += `**Path:** ${report.themePath}\n`;
	md += `**Date:** ${report.generatedAt}\n\n`;

	md += `## Summary\n\n`;
	md += `- **REQUIRED:** ${summary.required}\n`;
	md += `- **WARNING:** ${summary.warning}\n`;
	md += `- **RECOMMENDED:** ${summary.recommended}\n`;
	md += `- **INFO:** ${summary.info}\n\n`;

	if (findings.length === 0) {
		md += `## Findings\n\nNo issues found! 🎉\n`;
	} else {
		md += `## Findings\n\n`;
		const severityOrder = ['REQUIRED', 'WARNING', 'RECOMMENDED', 'INFO'];

		severityOrder.forEach((severity) => {
			const items = findings.filter((f) => f.severity === severity);
			if (items.length > 0) {
				md += `### ${severity}\n\n`;
				items.forEach((item) => {
					md += `- **[${item.check}]** \`${item.file}${item.line ? `:${item.line}` : ''}\`\n`;
					md += `  - ${item.message}\n`;
					if (item.fixHint) {
						md += `  - *Hint:* ${item.fixHint}\n`;
					}
					if (item.handbook) {
						md += `  - *Ref:* ${item.handbook}\n`;
					}
				});
				md += `\n`;
			}
		});
	}

	fs.writeFileSync(outputPath, md, 'utf8');
}

export { generateJsonReport, generateMarkdownReport };
