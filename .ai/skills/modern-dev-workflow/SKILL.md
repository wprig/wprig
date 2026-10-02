---
name: modern-dev-workflow
description: Guide for using the Vite-powered modern dev server and managing local development configuration in WP Rig.
globs: config/config.json, config/config.default.json, dev-server.js
---

# Modern Dev Workflow in WP Rig

WP Rig offers a high-performance development experience via its "modern" dev server, powered by esbuild, browsersync, and Bun. This provides lightning-fast HMR (Hot Module Replacement) and optimized asset serving.

## Dev Server Commands

### Modern (Recommended)
```bash
npm run dev:modern
```
This launches an esbuild proxy server that handles CSS, JS, and PHP updates with minimal latency.

### Legacy (BrowserSync)
```bash
npm run dev
```
Use this if the modern server is not compatible with your environment or specific requirements.

## Configuration & Local Access

Before configuring or starting the development environment, you **MUST** reference the `config/config.json`.

*   **Proxy URL:** Use `dev.browserSync.proxyURL` (or `dev.devURL` for modern) for local URL references.
*   **Admin Access:** Use `dev.admin` credentials if automated testing or environment setup requires administrative access.

## Configuration (`config/config.json`)

All dev server settings are managed in `config/config.json`. Ensure your local URL is correctly set.

### Example Configuration
```json
{
  "dev": {
    "devURL": "http://wprig-dev.local",
    "port": 3000,
    "modern": {
      "port": 5173,
      "https": false,
      "open": true
    }
  }
}
```

### Key Configuration Properties
- **`devURL`**: The local URL of your WordPress installation. This is the source for the proxy server.
- **`port`**: The port for the legacy BrowserSync server.
- **`modern.port`**: The port for the Vite dev server.
- **`modern.https`**: Set to `true` if your local WordPress site uses HTTPS.
- **`modern.open`**: Automatically open the browser on startup.

## SSL & HTTPS

If your local site is running over HTTPS, you must configure the modern dev server to support it.

1. Ensure `modern.https` is `true` in `config/config.json`.
2. WP Rig automatically attempts to generate or use existing SSL certificates (typically via `mkcert`).
3. If certificates are not found, the server may fall back to HTTP or prompt for manual setup.

## Troubleshooting

- **Proxy Failures**: Ensure `devURL` matches your local site exactly (including `http://` or `https://`).
- **Port Conflicts**: If port `5173` or `3000` is already in use, update the ports in `config/config.json`.
- **HMR Not Working**: Verify that your browser is not blocking connections to the Vite port.

## Best Practices for Agents

1. **Always use Modern**: Prefer `npm run dev:modern` for faster development.
2. **Local Environment Detection**: Before running dev scripts, check the current `devURL` in `config/config.json` to ensure it matches the environment.
3. **Configuration Persistence**: Always make changes to `config/config.json`, not the default `config/config.default.json`.
4. **Environment Check**: If you encounter issues, verify that the local WordPress site is up and reachable before starting the dev server.
