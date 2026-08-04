# WP Rig vs Roots Sage: Why Modern Developers are Choosing WP Rig for WordPress Theme Development

Choosing the right starter theme is one of the most critical architectural decisions you will make in **modern WordPress theme development**. The boilerplate you select defines your build pipeline, directory structure, coding patterns, and—most importantly—the performance of the final website.

For developers seeking a modern, command-line-driven workflow, two primary frameworks dominate the conversation: **WP Rig** and **Roots Sage**.

Roots Sage is a highly popular, Laravel-inspired starter theme with a dedicated following. But in recent years, a massive shift has occurred. Developers are increasingly moving away from Sage in favor of **WP Rig** as their primary theme engineering platform.

In this deep-dive, head-to-head comparison, we will break down **WP Rig vs Roots Sage**, analyzing their architecture, performance, build tools, and developer experience. We will fairly evaluate Sage's perks, and then explain why WP Rig represents a lighter, faster, and more future-proof choice for custom WordPress themes.

---

## What is Roots Sage? (Acknowledging Its Perks)

Before analyzing why WP Rig is the superior alternative, we must give credit where credit is due. Developed by the Roots team, Sage is an excellent, sophisticated theme framework that has pushed the boundaries of WordPress development.

Key advantages of Roots Sage include:
*   **The Blade Templating Engine:** Sage integrates Laravel’s Blade templates, allowing developers to write clean, expressive layout files with dry logic, inheritance, and components instead of traditional PHP loops.
*   **Acorn Integration:** Sage leverages Acorn to boot Laravel-style service providers, dependency injections, and view-composers inside WordPress.
*   **Tailwind CSS Out-of-the-Box:** Sage is configured for utility-first styling with Tailwind CSS, making it a favorite for frontend developers who love utility classes.
*   **A Familiar Ecosystem:** For developers coming from the Laravel ecosystem, Sage feels immediately familiar and comfortable.

Sage is a powerful framework, but its high-complexity, Laravel-centric architecture introduces significant trade-offs. For standard, high-performance custom themes, many developers find Sage to be overly heavy, slow to compile, and difficult to align with native WordPress standards.

---

## 1. Runtime Performance: Heavy Acorn Overhead vs. Lightweight Native PHP OOP

The most significant architectural difference between the two starter themes lies in their runtime footprint.

### Roots Sage: The Acorn Dependency
To execute Blade templates and Laravel controllers, Sage requires you to install and boot **Acorn** (essentially a Laravel application instance running inside WordPress). Every single page load requires WordPress to bootstrap the Laravel container. This introduces substantial PHP memory overhead, increased execution times, and extra latency that can negatively impact your server response times and Core Web Vitals.

### WP Rig: Pure, High-Performance Native PHP
WP Rig takes a completely different approach. It leverages a clean, modern, and highly optimized **Object-Oriented Programming (OOP)** design that operates natively within WordPress. 

Instead of wrapping your theme in an external framework, WP Rig organizes logic into standalone, self-contained **Components** under the `inc/` directory. Each component implements a standard, lightweight interface:
```php
namespace WP_Rig\WP_Rig\Styles;

use WP_Rig\WP_Rig\Component_Interface;

class Component implements Component_Interface {
    public function get_slug() : string {
        return 'styles';
    }
    public function initialize() {
        add_action( 'wp_enqueue_scripts', [ $this, 'action_enqueue_styles' ] );
    }
}
```
There is no second container to boot, no heavy dependency injection layer, and no added latency. WP Rig utilizes PSR-4 autoloading and strict type hints, delivering maximum execution speeds and a rock-solid, secure performance foundation out of the box.

---

## 2. Compilation Speed: Bud/Webpack vs. Vite-Like Blazing Fast Tooling

Your build system’s compilation speed directly dictates your developer flow state. Waiting on a slow bundler to compile styles or scripts can kill productivity.

### Roots Sage: Bud & Webpack
Sage uses **Bud** (a build wrapper developed by Roots, built on top of Webpack) to compile assets. While Bud is highly flexible, it is still built on Webpack. This means that as your theme grows, compilation times for CSS and JavaScript files steadily increase. Hot-reloading can feel sluggish, and configuring Bud to fit custom workflows often requires navigating complex, abstract config files.

### WP Rig: Bun, esbuild, & Lightning CSS
WP Rig completely bypasses Webpack bloat. Its ultra-modern build pipeline utilizes next-generation, high-performance compilation engines:
*   **Bun or Node.js** drive the underlying task executors.
*   **esbuild** compiles and bundles TypeScript and ESNext JavaScript in a fraction of a millisecond.
*   **Lightning CSS** parses, imports, and minifies stylesheets with unmatched efficiency.

WP Rig's compilation is **up to 10x faster** than Webpack-based pipelines. Furthermore, WP Rig includes an opt-in **Modern Dev Server (`npm run dev:modern`)** that acts like a Vite dev server. It provides a lightweight local proxy, enabling hot style injections and instantaneous page refreshes. You can read more about this on the [WP Rig Workflows Page](https://wprig.io/documentation/wp-rig-node-scripts/).

---

## 3. Block Editor (Gutenberg) & Full Site Editing (FSE) Integration

Modern WordPress is centered around the Block Editor (Gutenberg) and Full Site Editing (FSE). A starter theme must play nicely with WordPress's native blocks.

### Roots Sage: Blade vs. Blocks
Sage's Blade template system is structurally disconnected from native Gutenberg blocks. Getting Blade components to render seamlessly inside the WordPress block editor editor-style environments is notoriously difficult. Creating blocks in Sage often requires additional third-party libraries (like Sage-compatible block builders or ACF blocks), which adds further complexity and layers of abstraction.

### WP Rig: Native, Theme-Scoped Block Engineering
WP Rig is built with native Gutenberg block development at its core. It includes a built-in block scaffolding system powered directly by `@wordpress/create-block`:
```bash
npm run block:new my-custom-block
```
This generates a theme-scoped, FSE-ready block directory under `assets/blocks/my-custom-block/`. 

Even better, WP Rig is ready for **WordPress 7.0 PHP-only blocks**. By running:
```bash
npm run block:new my-php-block -- --architecture php
```
WP Rig scaffolds a zero-build custom block featuring an auto-registering `block.json` and a clean `render.php` template, completely bypassing Javascript compilation overhead. The core block component at `inc/Blocks/Component.php` automatically discovers and registers all blocks in your directory on `init`.

---

## 4. Feature Modularities: Monolithic Setup vs. "A La Carte" Component Registry

When building client sites, you rarely need every single feature out-of-the-box. Stripping out unwanted code should be effortless.

### Roots Sage: The Monolithic Boilerplate
Sage comes as a monolithic package. If you don't want Tailwind, or if you want to swap out Webpack, or delete custom controller classes, you must manually dig through directories, edit Laravel-style config files, prune composer dependencies, and rewrite core boot classes.

### WP Rig: The Open Component Registry (OCR)
WP Rig acts as a modular, composable development platform powered by the **Open Component Registry**. Instead of starting with a heavy starter pack, you can discover, add, and remove vetted, performance-optimized features on-demand from the command line:
*   `npm run rig:list` – Check all active theme components.
*   `npm run rig:search [keyword]` – Discover open, engineered components.
*   `npm run rig:add [slug]` – Inject a complete, tested PHP feature and its assets into your theme.
*   `npm run rig:remove [slug]` – Completely prune a component with zero leftover bloat.

For digital agencies, WP Rig supports **private component registries**. You can package and distribute your own internal, proprietary client integrations securely across your projects, maximizing code reusability while keeping your IP safe. Learn more at [WP Rig Component Registry](https://wprig.io/documentation/php-architecture-in-wp-rig/).

---

## 5. CSS Workflows: Tailwind Bloat vs. Future-Proof Native CSS

How you write CSS affects not only developer experience but also the raw output size of your production assets.

### Roots Sage: Heavily Tied to Tailwind
Sage is heavily opinionated toward Tailwind CSS. While Tailwind is fantastic for rapid layouts, utility-first CSS leads to highly cluttered Blade templates overflowing with classes. It also requires heavy PostCSS compilation to strip out unused utilities for production, making your stylesheets completely dependent on a complex, abstract build system.

### WP Rig: Standards-Driven CSS via Lightning CSS
WP Rig champions writing **native, future-proof CSS** without heavy pre-processors or utility bloat. Operating entirely via **Lightning CSS**, WP Rig supports modern specifications today with zero-configuration browser fallbacks:
*   **CSS Nesting Level 1:** Write clean, nested selectors natively without Sass.
*   **CSS Variables:** Store design tokens globally in `_custom-properties.css` using `:root`.
*   **Custom Media Breakpoints:** Declare breakpoint variables under the upcoming `@custom-media` spec in `_custom-media.css`, which Lightning CSS transpiles into standard media queries.
*   **Dynamic Image Path Resolution:** WP Rig includes a custom build script that resolves and rewrites relative image paths (e.g., pointing to files in `assets/images/`) into production-ready URLs. You never have to manually hardcode absolute paths in your CSS.

This results in highly structured, incredibly lightweight, and standards-compliant stylesheets. Read more on the [CSS in WP Rig Page](https://wprig.io/documentation/css-in-wp-rig/).

---

## 6. Official WordPress.org Directory Readiness

If your goal is to distribute your theme publicly on the official **WordPress.org Theme Directory**, your boilerplate choice is highly restricted.

### Roots Sage: Virtually Prohibited
The official WordPress Theme Review guidelines enforce strict coding, structural, and template standards. Sage's non-standard directory layouts, reliance on Acorn, Laravel controllers, and Blade template files make it virtually impossible to submit to the official repository. If you build a theme in Sage, it is locked into premium-only or private distribution.

### WP Rig: Completely Directory-Ready
WP Rig is built in strict alignment with official WordPress.org Theme Review guidelines. Out of the box, running:
```bash
npm run ai:check
```
triggers automated **PHP Code Sniffer (PHPCS)** audits configured to validate your code against official WordPress Coding Standards (WPCS). 

Furthermore, WP Rig is prepared for block-directory submission. While custom blocks are considered "plugin territory" by review guidelines, WP Rig lets you build and test blocks locally, and instantly package and promote them to standalone plugins with a single command:
```bash
npm run block:promote-plugin <block-slug>
```
Your WP Rig codebase remains perfectly compliant and ready for directory submission from day one.

---

## 7. Automated Quality Assurance & CI/CD Pipelines

Delivering robust, secure code to enterprise clients demands rigorous testing. Setting up automated QA in legacy themes is often a major pain point.

### Roots Sage: Manual Configuration Needed
While Sage integrates with standard PHP testing tools, setting up a comprehensive quality assurance workflow with static analysis, browser end-to-end tests, and accessibility audits requires manual configuration and heavy pipeline scripting.

### WP Rig: Out-of-the-Box QA Automation
WP Rig features an incredibly advanced, pre-configured QA suite that operates with a single command:
*   **PHPStan Static Analysis:** Runs strict type checking and static analysis to capture bugs before execution.
*   **Playwright E2E Browser Testing:** Automatically spins up headless browsers to run smoke tests, verify navigation links, and execute visual regression audits via screenshots.
*   **Automated Accessibility Auditing:** Integrates `axe-core` directly into browser tests to perform automated accessibility audits on layouts (such as 404 and archive templates), ensuring WCAG compliance.

#### CI/CD Pipeline Ready
Because WP Rig's build toolchain is completely self-contained, it integrates seamlessly into modern **Continuous Integration / Continuous Deployment (CI/CD)** pipelines (like GitHub Actions or GitLab CI). 

Under the `"export"` settings in `config/config.json`, developers have absolute control over bundling. The bundler automatically excludes local configurations, private `.env` variables, development documentation, and raw assets. This lets your CI/CD pipeline compile your assets with `npm run build`, run automated static and browser testing, package the clean ZIP with `npm run bundle`, and deploy a lightweight, hardened artifact directly to production.

---

## 8. Parent-to-Child Theme Generation for ANY Parent Framework

For many agency developers, the absolute ideal workflow is building incredibly fast, modern child themes that inherit functionality from popular parent themes.

### Roots Sage: Locked Into Standalone
Sage is structurally engineered to operate as a standalone, parent starter theme. Using Sage to build a child theme for a third-party framework is highly complex and practically defeats the purpose of Sage's Laravel-based architecture.

### WP Rig: Ultimate Child Theme Generator
WP Rig includes a dedicated, highly versatile `childify` script:
```bash
node node/childify.js
```
This script instantly bootstraps a streamlined child theme in your workspace. What makes WP Rig’s child themes revolutionary is that they are **fully compatible with any parent theme on the market**. 

Whether you want to build a high-performance child theme for **Astra, GeneratePress, Divi, Kadence, or Twenty Twenty-Four**, WP Rig generates a child theme that inherits parent templates while retaining **its own independent, fully operational WP Rig modern build system** (complete with esbuild, Lightning CSS, and the Modern Dev Server). 

You can write modern CSS nesting, dynamic image pathing, and TypeScript inside the child theme's `src/` directory, while letting your favorite external parent framework handle core theme layouts.

---

## WP Rig vs Roots Sage: Head-to-Head Comparison

| Feature | Roots Sage | WP Rig |
| :--- | :--- | :--- |
| **PHP Architecture** | Heavy Laravel/Acorn Wrapper | Native, lightweight OOP PHP Components |
| **Boot Memory Footprint** | Moderate to High (Laravel boot overhead) | Minimal (Pure PHP execution) |
| **Asset Compilation** | Bud / Webpack (Slower) | Bun + esbuild + Lightning CSS (Blazing Fast) |
| **Development Server** | BrowserSync / Bud Proxy | Vite-Like Modern Dev Server (Instant Styles) |
| **Templating Engine** | Blade (Non-standard WordPress) | Native WordPress Template Parts |
| **Block / FSE Integration** | Requires 3rd-party builders / complex setups | Native, automatic registration, WordPress 7.0 PHP-only |
| **Component System** | Monolithic (Manual stripping) | "A La Carte" Open Component Registry (OCR) |
| **CSS Compiler** | Tailwind + PostCSS | Lightning CSS (Nesting, variables, pathing) |
| **Directory Submission** | Prohibited (Non-standard markup) | Fully Compliant (Automated PHPCS validation) |
| **Automated Testing** | Requires manual configuration | Built-in (PHPStan, Playwright, axe-core) |
| **Child Theme Support** | Standalone only | Supported on **any** parent framework (Astra, etc.) |

---

## Conclusion: Which Boilerplate Should You Choose?

Both WP Rig and Roots Sage are exceptional, developer-first boilerplate platforms, but they cater to fundamentally different philosophies.

*   **Choose Roots Sage** if you are a Laravel developer who is completely committed to the Laravel-Acorn ecosystem, strictly prefer utility-first workflows with Tailwind CSS, and only build standalone, premium client themes that will never be submitted to the official WordPress repository.
*   **Choose WP Rig** if you want an ultra-lightweight, natively structured, high-performance starter theme that respects standard WordPress coding patterns. WP Rig is the definitive choice if you want **blistering build speeds that rival Vite**, seamless native block and Full Site Editing integration, a-la-carte component modularity, out-of-the-box automated static and browser testing, secure CI/CD pipeline bundling, and the ability to author powerful child themes for popular parent frameworks like Astra or GeneratePress.

Are you ready to experience high-performance, future-proof theme engineering? **Clone WP Rig, run `npm run dev:modern`, and elevate your WordPress development workflow today!**
