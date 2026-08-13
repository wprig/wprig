---
description: Guide for using npm scripts in WP Rig to manage builds, development, and testing.
globs: package.json, scripts/**/*.js, node/**/*.js
---

# WP Rig npm scripts

This guide describes how to use the npm scripts defined in WP Rig's `package.json` for development, building, and maintenance.

## Core Development Scripts

*   `npm run dev`: Starts the primary development workflow. It builds all assets and watches for changes.
*   `npm run build`: Performs a one-time build of all CSS, JS, and block assets.
*   `npm run start`: An alias for starting the dev process.

## Build Scripts

*   `npm run build:css`: Builds only CSS files using `build-css.js`.
*   `npm run build:js`: Builds only JS/TS files using `build-js.js`.
*   `npm run build:blocks`: Builds all WordPress blocks located in the theme.
*   `npm run bundle`: Creates a production-ready theme bundle in the parent directory.
*   `npm run bundle:phpcs`: Same as bundle, but also runs PHPCS checks.

## Initialization and Setup

*   `npm run rig-init`: Installs both npm and composer dependencies and initializes the theme. Use this for the first setup.
*   `npm run setup-child`: Initializes the theme and creates a child theme using `childify.js`.

## Code Quality and Linting

*   `npm run lint:css`: Lints all CSS files in `assets/css/src/`.
*   `npm run lint:js`: Lints all JS/TS files in `assets/js/src/`.
*   `npm run build:phpcs`: Runs PHPCS on the project.

## WordPress Blocks

*   `npm run block:new`: Interactive command to create a new WordPress block.
*   `npm run block:new:dynamic`: Create a new dynamic (PHP-rendered) WordPress block.
*   `npm run block:list`: Lists all blocks in the theme.
*   `npm run block:remove`: Interactive command to remove a block.
*   `npm run start:blocks`: Watches and rebuilds blocks on change.

## Testing

*   `npm run test:e2e`: Runs Playwright End-to-End tests.
*   `npm run test:e2e:nav:watch`: Runs full visual navigation watch test suite in headed browser mode.
*   `npm run test:e2e:nav:watch:mobile`: Launches visual watch test directly in mobile viewport mode.
*   `npm run test:e2e:nav:watch:desktop`: Launches visual watch test directly in desktop viewport mode.
*   `npm run test:e2e:mobile-nav`: Runs 5-level deep mobile navigation tests in headless background mode.
*   `npm run test:e2e:mobile-nav:watch`: Runs 5-level deep mobile navigation tests in live headed watch mode.
*   `npm run test:e2e:ui`: Opens Playwright UI for debugging tests.
*   `npm run test:e2e:screenshot`: Captures regression screenshots using Playwright.
*   `npm run inspect`: Runs the fast semantic layout and sibling proximity inspector. Supports `--url`, comma-separated `--selector` strings, and `--screenshot` crop triggers.

## Utility Scripts

*   `npm run images`: Optimizes images in the `assets/images/` directory.
*   `npm run create-rig-component`: Helper to create a new WP Rig component class in `inc/`.
*   `npm run mcp`: Starts the Model Context Protocol server for documentation access.
*   `npm run generateCert`: Generates local SSL certificates for development.

## Best Practices for Agents

1.  **Always use `npm run dev`** when making changes to CSS or JS files to ensure they are compiled and you can see the results.
2.  **Use `npm run block:new`** instead of manually creating block folders to ensure WP Rig's block structure is followed.
3.  **Run `npm run lint:css` and `npm run lint:js`** before submitting changes to ensure code style consistency.
4.  **Use `npm run create-rig-component`** to scaffold new PHP components in the `inc/` directory.
