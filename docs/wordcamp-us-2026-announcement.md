# WP Rig is Heading to WordCamp US 2026! Join Our Hands-On AI & Theme Directory Workshop in Phoenix

The [WP Rig](https://wprig.io/) team is absolutely thrilled to share a massive announcement with our developer community: **WP Rig has been officially selected to be featured at WordCamp US 2026 in Phoenix, Arizona!** 

This year, the premier WordPress event in North America is hosting a hands-on, immersive workshop led by our very own **Rob Ruiz**, titled:
[**"Democratizing the Theme Directory: Building Block-Ready Themes with WP Rig & AI"**](https://us.wordcamp.org/2026/session/democratizing-the-theme-directory-building-block-ready-themes-with-wp-rig-ai/)

This is an incredible milestone for our project. Our mission has always been to elevate the standards of [WordPress theme engineering](https://wprig.io/documentation/php-architecture-in-wp-rig/) and give developers the ultimate, high-performance toolkit to build modern websites. Having our architecture and workflows highlighted on the main stage at [WordCamp US 2026](https://us.wordcamp.org/2026/) is a testament to the power of our growing community.

In this post, we’ll dive into what this milestone means for WP Rig, break down what you will learn in Rob's interactive workshop, and share how you can attend in person or tune in online to support the movement.

---

## The Vision: Democratizing the Theme Directory

For years, submitting a custom theme to the official [WordPress.org Theme Directory](https://wordpress.org/themes/) has been considered a daunting, time-consuming challenge. The official [WordPress Theme Review Team](https://make.wordpress.org/themes/) maintains incredibly strict quality, accessibility, security, and structural [Theme Review Guidelines](https://make.wordpress.org/themes/handbook/review/required/). For many independent developers and agencies, navigating the feedback loop of reviews and revisions has felt like an insurmountable barrier to entry.

At the same time, the transition from traditional classic templates to the block editor, `theme.json` configuration, and Full Site Editing (FSE) has created a significant learning curve.

Our [WordCamp US 2026](https://us.wordcamp.org/2026/) workshop is designed to smash those barriers down. By combining WP Rig’s performance-focused [Object-Oriented Programming (OOP) PHP architecture](https://wprig.io/documentation/php-architecture-in-wp-rig/) with the power of **AI-native engineering (agentic workflows)**, Rob Ruiz will demonstrate how any developer can build, test, and submit directory-ready, block-enabled WordPress themes with absolute confidence.

We want to show the WordPress community that high-quality, block-ready theme development is accessible to everyone—and WP Rig is the platform that makes it happen.

---

## What to Expect: A Hands-on, Immersive Workshop

Unlike traditional slide-heavy presentations, this is an **interactive, hands-on workshop**. You won't just be listening; you’ll be active in your terminal, writing code, executing automated tests, and collaborating with AI coding agents in real-time.

Here are the key technical pillars that Rob will guide participants through:

### 1. Blazing-Fast Compilation & Modern Tooling
Attendees will experience the true power of WP Rig's modernized build pipeline. We will configure and leverage [Bun](https://bun.sh/) and [Lightning CSS](https://lightningcss.dev/) to achieve near-instant feedback loops. Say goodbye to heavy Webpack bloat and slow compiler wait times—you will learn how to keep your development in a flow state using our Vite-like [Modern Dev Server](https://wprig.io/documentation/wp-rig-node-scripts/).

### 2. AI-Native Development & Agentic Workflows
As developers increasingly lean on AI coding assistants (like [GitHub Copilot](https://github.com/features/copilot), [Claude](https://claude.ai/), or [ChatGPT](https://chatgpt.com/)), we need codebases that minimize model "hallucinations." Rob will demonstrate why WP Rig’s strict OOP structure, namespaces, and PSR-4 compliant autoloading make it the ultimate playground for AI-assisted coding. You will learn how to write structured prompts and leverage custom AI instructions (`llms.txt`) to have AI write block-ready code that integrates perfectly into WP Rig.

### 3. Native Block Scaffolding & WordPress 7.0 PHP-Only Blocks
We will dive deep into Gutenberg block engineering. You will learn how to scaffold theme-scoped Gutenberg blocks directly inside your theme:
```bash
npm run block:new my-custom-block
```
We will also highlight the cutting-edge **WordPress 7.0 PHP-only block architecture**, showing how you can leverage a build-free custom block model (`--architecture php`) with auto-registering schemas. Finally, we'll demonstrate how to easily promote theme blocks to standalone plugins with a single command to ensure strict compliance with [WordPress.org Theme review guidelines](https://make.wordpress.org/themes/handbook/review/required/).

### 4. Eliminating the Review Loop with Automated QA
You will learn how to run WP Rig’s pre-configured automated testing suite locally:
```bash
npm run ai:check
```
We will dive into [PHPStan](https://phpstan.org/) static analysis to capture bugs, use [PHP Code Sniffer (PHPCS)](https://github.com/squizlabs/PHP_Code_Sniffer) along with the [WordPress Coding Standards (WPCS)](https://github.com/WordPress/WordPress-Coding-Standards) to audit our files, and run [Playwright End-to-End (E2E) browser tests](https://playwright.dev/) to audit templates for visual regression and WCAG accessibility standards via [axe-core](https://github.com/dequelabs/axe-core). By automating these checks locally, you can guarantee your code is directory-ready before you even hit submit.

---

## Workshop Prerequisites: What to Bring

If you are attending WordCamp US 2026 in Phoenix and plan to participate in Rob’s session, we want you to be fully prepared to code alongside us. 

To get the absolute most out of the hands-on exercises, we highly recommend bringing a laptop with the following pre-installed:
*   **Local WordPress Environment:** A local server environment such as [LocalWP](https://localwp.com/) or [WordPress Studio](https://developer.wordpress.org/studio/).
*   **NodeJS or Bun:** A local installation of [Node.js](https://nodejs.org/) (version 20 or higher) or [Bun](https://bun.sh/).
*   **Composer:** For running PHP packages and dependencies via [Composer](https://getcomposer.org/).
*   **A Clean Copy of WP Rig:** Clone the official [WP Rig GitHub Repository](https://github.com/wprig/wprig) locally so you are ready to boot up your terminal on day one.

No advanced block-building experience is required! If you have a foundational knowledge of PHP, CSS, and basic terminal commands, you are perfectly equipped to succeed in this session.

---

## Join Us in Phoenix or Tune in Online!

[WordCamp US 2026](https://us.wordcamp.org/2026/) is shaping up to be an extraordinary gathering of minds in Phoenix, Arizona. It is the ultimate place to connect with other developers, share ideas, and witness the future of the WordPress project.

### Attending in Person?
If you are buying [WordCamp US 2026 tickets](https://us.wordcamp.org/2026/tickets/) and making the trip to Phoenix, we would love to meet you! Be sure to add **"Democratizing the Theme Directory: Building Block-Ready Themes with WP Rig & AI"** to your custom session schedule. Come early to secure a seat, bring your laptop, and make sure to stop by and say hello to Rob Ruiz after the session. We love connecting with our users and hearing about the incredible custom sites you are building with WP Rig.

### Tuning in Remotely?
If you can’t make the trip to Arizona, you don't have to miss out on the excitement. WordCamp US live-streams session tracks globally. We will be sharing streaming links, real-time slides, and workshop resources across our social channels and right here on our blog as the event approaches.

---

## Help Us Spread the Word!

We want to raise massive awareness about WP Rig and show the broader WordPress community that modern, high-performance, and standards-compliant theme engineering is within reach for every developer. 

You can support the project today by:
*   **Starring our GitHub Repository:** Show your love and help other developers discover our [GitHub repository](https://github.com/wprig/wprig).
*   **Sharing the News:** Post about our WordCamp US session on X/Twitter, LinkedIn, and in your developer Slack groups.
*   **Telling a Peer:** Let your developer friends and agency colleagues know that they can build better child and parent themes faster with WP Rig.

We are incredibly grateful for your continued support, contributions, and enthusiasm. We can’t wait to represent the WP Rig community in Phoenix and help democratize WordPress theme development for everyone.

**See you at WordCamp US 2026! 🌵☀️**
