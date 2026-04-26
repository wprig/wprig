# Core-Block Mapping Strategy: Optimus Primary

## 1. The "Native-First" Philosophy
The most efficient way to build modern WordPress themes is to leverage core Gutenberg blocks and extend them with **Design Tokens** (via `theme.json`) and **Custom CSS Classes**. This minimizes the maintenance burden of custom JavaScript while providing a seamless editing experience.

## 2. Structural Mapping Table

| Design Section | Core Block(s) | Custom Class / Tweak | Role |
| :--- | :--- | :--- | :--- |
| **Hero Wrapper** | `core/cover` | `.optimus-hero-shell` | Handles background image and Three.js canvas injection point. |
| **Hero Content** | `core/columns` | `.is-style-optimus-layout` | Splits text and high-tech hand card. |
| **Status Pill** | `core/group` | `.optimus-status-pill` | Uses border-radius and inner-glow CSS. |
| **Hero Title** | `core/heading` | `text-display` | Bound to Space Grotesk in `theme.json`. |
| **Trusted Bar** | `core/group` (Row) | `.optimus-trusted-row` | Applies `grayscale` and `opacity-30` to child elements. |
| **Bento Grid** | `core/group` (Grid) | `.optimus-bento-grid` | Uses CSS Grid to define spans (Large, Vertical, Small). |
| **Bento Item** | `core/group` | `.glass-card` | Global utility for glassmorphism. |
| **Showcase Section** | `core/columns` | `.optimus-showcase` | Handles the technical corner accents via `::before/::after`. |

## 3. Implementation Workflow

### A. theme.json as the Foundation
Instead of hardcoding colors, we register the Optimus palette in `theme.json`.
*   **Result**: The user can pick "Electric Cyan" or "Obsidian" from the block editor's native color picker.
*   **AI Advantage**: I can use preset variables like `var(--wp--preset--color--accent)` which are more resilient than hex codes.

### B. Block Styles vs. Global CSS
For complex visuals like the "Glass Card," we register a **Block Style**:
```php
register_block_style('core/group', [
    'name'  => 'optimus-glass',
    'label' => 'Optimus Glass',
]);
```
This allows the editor to simply click a button in the sidebar to turn a standard Group into a glassmorphic container.

### C. The Layout "Glue"
The `front-page.php` remains useful but only as a **Block Template Provider**. Instead of hardcoded HTML, it should load a **Block Pattern** or a specific **Template Part** that consists entirely of the mapped core blocks.

## 4. Why this is the "Gold Standard"
1.  **Editor-Frontend Sync**: Because we use core blocks, the layout in the editor is a 1:1 match with the frontend by default.
2.  **Performance**: We leverage WordPress's optimized block loading.
3.  **Future Proofing**: When WordPress improves the `core/cover` block (e.g., better focal point control), Optimus Primary inherits those features automatically.

## 5. Framework Recommendation: Pattern Registry
WP Rig should prioritize the **Pattern Registry**. Instead of scaffolding blocks, we should be scaffolding **Block Patterns**. 
*   **Action**: Create `patterns/optimus-hero.php` which is a predefined assembly of core blocks. An AI can then "drop" this pattern onto the home page via the MCP server in a single operation.

---
*Document Authored by: Gemini CLI Agent*
*Topic: Leveraging Core Gutenberg Blocks for High-Fidelity Design*
