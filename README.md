<img align="right" width="90" height="90"
src="https://avatars1.githubusercontent.com/u/38340689"
title="WP Rig logo by Morten Rand-Hendriksen and Rob Ruiz">

# WP Rig: WordPress Theme Boilerplate

> [!IMPORTANT]
> 🤖 **AI Agents:** You MUST follow the [Mandatory Development Protocol](./AGENTS.md) to ensure architectural integrity.

[![Build Status](https://github.com/wprig/wprig/workflows/CI/badge.svg)](https://github.com/wprig/wprig/actions)
[![License: GPL](https://img.shields.io/github/license/wprig/wprig)](/LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/wprig/wprig?include_prereleases)](https://github.com/wprig/wprig/releases)

## Your Performance-Focused Development Rig

A progressive theme development rig for WordPress, WP Rig is built to promote the latest best practices for progressive
web content and optimization. Creating a theme from WP Rig means adopting this approach and the core principles it is
built on:

- Accessibility
- Mobile-first
- Progressive enhancement
- [Resilient Web Design](https://resilientwebdesign.com/)
- Progressive Web App enabled


We are trying to be the starter theme for design-focused devs. If you have any ideas, questions, or suggestions for this
project or are seeking to get involved in contributing or maintaining, please check out
our [discussion board on Github](https://github.com/wprig/wprig/discussions) and
read [our contribute page](https://wprig.io/contribute/) on our website.

## Documentation

We have a new Documentation area that can be found on the [WP Rig website](https://wprig.io/documentation/).
If you would like to contribute to our documentation efforts, please submit a request on
our [contribute page](https://wprig.io/contribute/) on our website.

## Installation

WP Rig has been tested on Linux, Mac, and Windows.

### Requirements

WP Rig requires the following dependencies. Full installation instructions are provided at their respective websites.

- [PHP](http://php.net/) 8.1 or higher (PHP 8.3 recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.com/)
- [Composer](https://getcomposer.org/) (installed globally)

### WP Rig and child themes

WP Rig is built to lay a solid theme foundation, which makes it excellent for both parent themes and child themes. WP Rig now includes a dedicated childify script that optimizes the theme for use as a child theme while maintaining all the development benefits of the WP Rig workflow. This allows you to create lightweight child themes that inherit functionality from any parent theme while still leveraging WP Rig's build system.

### How to install WP Rig:

1. Clone or download this repository to the themes folder of a WordPress site on your development environment.
	- DO NOT give the WP Rig theme directory the same name as your eventual production theme. Suggested directory names
	  are `wprig` or `wprig-themeslug`. For instance, if your theme will eventually be named “Excalibur” your
	  development directory could be named `wprig-excalibur`. The `excalibur` directory will be automatically created
	  during the production process and should not exist beforehand.
2. Configure theme settings, including the theme slug and name.
	- View `./config/config.default.json` for the default settings.
	- Place custom theme settings in `./config/config.json` to override default settings.
		- You do not have to include all settings from config.default.json. Just the settings you want to override.
	- Place local-only theme settings in `./config/config.local.json`, e.g. potentially sensitive info like the path to
	  your BrowserSync certificate.
		- Again, only include the settings you want to override.
3. In the command line, run `npm run rig-init` to install necessary node and Composer dependencies.
4. In the command line, run `npm run dev` to process source files, build the development theme, and watch files for
   subsequent changes.
	- `npm run build` can be used to process the source files and build the development theme without watching files
	  afterwards.
	- `npm run childify` can be used to convert your WP Rig theme into a lightweight child theme that inherits from any parent theme.
5. In WordPress admin, activate the WP Rig development theme.
6. (Optional) Run `npm run ai:setup` to configure the project for your specific AI coding agent (Claude, Cursor, Windsurf, etc.).

#### Recommended Git Workflow
When working with WP Rig, it is important to understand the appropriate Git workflow depending on what you are working on.
If you are using WP Rig as a starting point for a new theme, you should use the following workflow:

[Recommended Git Workflow](https://wprig.io/documentation/recommended-git-workflow/)

It is also important to note that the main branch now ignores the package-lock.json file.
While this is ideal for how we distribute WP Rig, it can cause issues when working with a local development environment or on a team using a forked WP Rig.
If you are using a local development environment, you should add the package-lock.json file to the .gitignore file
with a ! in front to prevent ignoring the file in your new theme's repo.

#### Defining custom settings for the project

Here is an example of creating a custom theme config file for the project. In this example, we want a custom slug, name,
and author.

Place the following in your `./config/config.json` file. This config will be versioned in your repo, so all developers
use the same settings.

```
{
  "theme": {
    "slug": "newthemeslug",
    "name": "New Theme Name",
    "author": "Name of the theme author"
  }
}
```

#### Defining custom settings for your local environment

Some theme settings should only be set for your local environment. For example, if you want to set local information for
BrowserSync.

Place the following in your `./config/config.local.json` file. This config will not be tracked in your repo and will
only be executed in your local development environment.

```
{
  "dev": {
	"browserSync": {
		"live": true,
		"proxyURL": "localwprigenv.test",
		"https": true,
		"keyPath": "/path/to/my/browsersync/key",
		"certPath": "/path/to/my/browsersync/certificate"
	}
  }
}
```

If your local environment uses a specific port number, for example, `8888`, add it to the `proxyURL` setting as follows:

```
"proxyURL": "localwprigenv.test:8888"
```

## How to build WP Rig for production:

1. Follow the steps above to install WP Rig.
2. Run `npm run bundle` from inside the `wp-rig` development theme.
3. A new, production-ready theme will be generated in `wp-content/themes`.
4. The production theme can be activated or uploaded to a production environment.

## AI-Assisted Development

WP Rig is natively designed for AI coding assistants (like Cursor, Windsurf, Copilot, or CLI agents). We employ a robust AI agent strategy to ensure the code generated adheres to WP Rig's strict Object-Oriented standards.

- **Agent Workflows:** AI tools are guided by our `.ai/` directory, which maintains strict architectural context, project rules (`.ai/PROJECT_RULES.md`), and an agent state tracker (`.ai/agent-state.md`).
- **Initial Setup:** Run `npm run ai:setup` to configure the workspace for your specific AI coding assistant. This script sets up the `.ai/ONBOARDING.md` flow so your AI learns the local theme conventions.
- **Mandatory Protocol:** All automated coding agents must refer to [AGENTS.md](./AGENTS.md) before executing tasks.

## Architecture & Development

WP Rig uses a modular component architecture and a modern build system to optimize your development workflow.

- [**Architecture & Component System**](./docs/architecture.md): Explore the directory structure and the modular component framework.
- [**Build Process & Workflows**](./docs/workflow.md): Learn how CSS, JS, and production bundles are handled, including the modern dev server.
- [**CLI Commands & Scripts**](./docs/commands.md): Reference for NPM/Bun, Composer, and WP-CLI commands.
- [**Advanced Features**](./docs/advanced-features.md): Documentation for critical assets, font performance, and theme-scoped blocks.
- [**Block-Based Theme Conversion**](./docs/block-based-theme.md): Guide on how to align the theme with Full Site Editing.

For more information about commands and useful workflows, please visit the [WP Rig website](https://wprig.io/documentation/).

## License

WP Rig is released
under [GNU General Public License v3.0 (or later)](https://github.com/wprig/wprig/blob/master/LICENSE).
