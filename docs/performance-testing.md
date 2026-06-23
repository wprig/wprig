# Performance Testing in WP Rig

WP Rig integrates Lighthouse CI to provide automated performance, accessibility, best practices, and SEO audits for your WordPress theme during local development.

## Getting Started

Performance testing in WP Rig leverages your existing local development environment. Ensure your local WordPress site is running before executing these commands.

### Running Audits

You can run the full suite of Lighthouse audits using the following command:

```bash
npm run test:perf
```

This command will:
1. **Collect**: Run Lighthouse against the homepage, a sample page, and a single post (3 runs each for consistency).
2. **Assert**: Verify the results against the defined performance budgets.
3. **Upload**: Upload the results to a temporary public storage and provide you with a URL to view the full report.

### Useful Commands

- `npm run test:perf`: Runs the full audit (collect, assert, upload).
- `npm run test:perf:collect`: Only runs the performance collection phase.
- `npm run test:perf:report`: Opens the HTML report of the most recent run in your browser.

## Configuring Performance Budgets

The performance budgets and URLs are defined in the `.lighthouserc.cjs` file located in the theme root.

### Adjusting Thresholds

You can modify the `assertions` section in `.lighthouserc.cjs` to match your project's requirements. For example, to change the Largest Contentful Paint (LCP) budget:

```javascript
'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
```

Available metrics include:
- `categories:performance`: Overall performance score (0-1).
- `categories:accessibility`: Overall accessibility score (0-1).
- `largest-contentful-paint`: Time in ms.
- `cumulative-layout-shift`: Layout shift score.
- `total-blocking-time`: Time in ms.

### Adding New URLs

To test additional pages, add them to the `ci.collect.url` array in `.lighthouserc.cjs`. The configuration automatically resolves your local `proxyURL` from `config/config.json`.

## Interpreting Results in WordPress

When reviewing Lighthouse reports for a WordPress theme, keep the following in mind:

1. **Theme vs. Plugins**: Performance issues may be caused by active plugins rather than the theme itself. Try running audits with plugins disabled to establish a theme baseline.
2. **Images**: WordPress's native image handling (sizes, lazy loading) significantly impacts LCP and CLS. Ensure you are using appropriate image sizes in your templates.
3. **Web Vitals**: Focus on the Core Web Vitals (LCP, FID/TBT, CLS) as these are the primary metrics used by search engines to evaluate user experience.
4. **Local Environment Variance**: Results may vary slightly between runs due to local system resources. The default configuration runs each page 3 times to provide a more stable average.
