# Pushing the Limits of Theme Performance: How WP Rig 3.4.2 Leverages Block Manifests to Bulletproof Server-Side Speed

If you have ever built a production block-based WordPress site, you know the unspoken truth of custom Gutenberg block development: **as your library of custom blocks grows, your server-side performance shrinks.**

In the WordPress theme landscape, **WP Rig** has always stood out as the developer's favorite choice for building high-performance, modular custom themes. With the release of **WP Rig 3.4.2**, we are taking that performance promise to a whole new level. 

By integrating modern WordPress 6.7 & 6.8 APIs, WP Rig 3.4.2 introduces **Block Manifest Registration**—virtually eliminating the runtime filesystem and JSON-decoding tax on block loading.

Here is how we did it, why it matters, and why your next site is going to load faster than ever.

---

## The Silent Performance Killer: Runtime Directory Scanning

Until now, standard multi-block themes registered custom block folders on the WordPress `init` hook by dynamically searching the disk. On every single page load—whether a user was visiting a blog post on the frontend or a writer was typing in the Gutenberg admin—the theme had to:
1. Scan the `assets/blocks/` folder on your server to discover subdirectories.
2. Verify files and check for the existence of `block.json` for each custom block.
3. Read the contents of each file from the disk.
4. Execute CPU-heavy `json_decode()` operations to parse block metadata, dependencies, and styles.

If your site had 20 custom blocks, that meant **20 separate disk reads and 20 JSON-parsing cycles on every single request**. This filesystem and CPU tax scaled linearly, degrading TTFB (Time to First Byte) as your theme grew.

---

## Enter WordPress 6.7 / 6.8 & Block Metadata Collections

With WordPress 6.7, the Core team introduced a revolutionary capability: **Block Metadata Collections**. By consolidating multiple JSON metadata files into a single, compiled PHP manifest array, WordPress can completely bypass filesystem reads.

In **WP Rig 3.4.2**, we have automated this entire flow so you reap 100% of the benefits with **zero manual configuration**.

During the asset build process (`npm run build`), WP Rig compiles all your block configurations into a single, native PHP manifest at `assets/blocks/blocks-manifest.php`. This file returns a pre-parsed PHP array mapping your blocks:

```php
<?php
// This file is generated. Do not modify it manually.
return array(
    'hero' => array(
        'name' => 'wp-rig/hero',
        'apiVersion' => 2,
        'title' => 'Hero',
        'editorScript' => 'file:./build/index.js',
        // ... and so on
    ),
    'icon' => array( ... ),
);
```

### Why PHP Arrays inside OPcache are Instantaneous
Unlike JSON files which must be read from disk and decoded dynamically by PHP, native PHP arrays can be cached in **OPcache** (PHP's built-in memory cache). 

When WordPress requests your block metadata, it is read directly from memory almost instantly. There is no disk seek, no read overhead, and zero runtime JSON parsing!

---

## The "Best of Both Worlds" Registration Pipeline

In WP Rig 3.4.2, we implemented an elegant, multi-tier fallback architecture that ensures your theme is both blisteringly fast in production and seamless during local development:

1. **Tier 1: Modern WordPress 6.8+ Batch Loading**
   On modern servers running WordPress 6.8+, WP Rig uses a single Core statement to register your entire block library in one shot:
   ```php
   wp_register_block_types_from_metadata_collection( $blocks_dir, $manifest_file );
   ```
2. **Tier 2: WordPress 6.7 Collections**
   For servers running WordPress 6.7, WP Rig initializes the collection and registers individual block types directly from memory—still bypassing the filesystem.
3. **Tier 3: Graceful Legacy Fallback (WP < 6.7)**
   If your server runs an older version of WordPress, or if you're in local development and haven't run a build yet, the loader automatically and gracefully falls back to traditional directory scanning. No crashes, no configuration changes, just pure stability.

---

## How to Try It Today

Getting started with Block Manifests in WP Rig 3.4.2 is effortless:

1. **Compile your assets:**
   ```bash
   npm run build
   ```
   *This compiles your scripts and compiles the new `assets/blocks/blocks-manifest.php` file.*
2. **Reload your site:**
   Your site is now running on the optimized Tier 1 or Tier 2 pathway, utilizing the compiled in-memory PHP array.

---

## Pushing the Future of WordPress Development

With WP Rig 3.4.2, theme performance is no longer a trade-off. You can build as many beautiful, modular, highly customized Gutenberg blocks as your clients need, confident that your server response times will remain flat and incredibly fast.

Upgrade your WP Rig theme to the latest version today, compile your assets, and watch your server-side rendering times plummet!
