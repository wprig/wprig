# WP Rig AI Style Guide & Design Protocol

Welcome, AI Agent! This file is the official design contract and styling protocol for this theme. While you are encouraged to expand and refine this guide over time as you coordinate with the developer, this document establishes **mandatory defaults** designed to solve common AI-specific visual bugs, maintain high aesthetic quality, and prevent "AI design slop."

You **MUST** consult this guide before generating CSS/styles and reference it in every `SPEC.md` during Feature Planning.

---

## 🎨 1. Color Science & Palette Architecture

AI models often generate chaotic or oversaturated color combinations that lack professional hierarchy. To ensure a polished, accessible theme, adhere to the following color science guidelines.

### The 60-30-10 Dominance Rule
Maintain visual balance in every layout by distributing color weight mathematically:
- **60% Dominant (Base Backgrounds):** Usually white, off-white, light gray, or dark slate. This establishes the overall canvas and tone.
- **30% Secondary (Structural/Text):** Body copy, card backgrounds, borders, and main layout blocks. This provides visual structure and readable content.
- **10% Accent (CTAs & Highlights):** Reserved exclusively for interactive elements like primary buttons, hover states, badges, and focal call-to-actions.

### Default Color Palette Tokens
If specific colors are not defined in `config/tokens.json` or `config/config.json`, use these balanced, research-backed defaults:

| Token | CSS Variable | HEX Value | Design Role / Usage |
| :--- | :--- | :--- | :--- |
| **Primary/Brand** | `--color-primary` | `#2563EB` | Active states, primary UI boundaries, core brand elements (Royal Blue) |
| **Secondary** | `--color-secondary` | `#4B5563` | Sub-headings, structural borders, secondary buttons (Cool Gray) |
| **Accent/CTA** | `--color-accent` | `#F59E0B` | Critical highlights, action buttons, notifications (Amber/Warm Gold) |
| **Base Dark** | `--color-text` | `#111827` | High-contrast body text, primary title text (Slate Black) |
| **Base Light** | `--color-background` | `#F9FAFB` | Main background, body container walls (Warm Alabaster) |
| **Success** | `--color-green` | `#10B981` | Validation checkmarks, positive alerts, purchase indicators (Emerald Green) |
| **Danger** | `--color-red` | `#EF4444` | Errors, delete actions, warnings (Rose Red) |

### Contrast & WCAG Compliance
Never guess contrast accessibility. You **MUST** ensure all text/background pairs meet WCAG AA standards:
- **Normal Text (below 18pt):** Minimum contrast ratio of **4.5:1** (e.g., `#111827` on `#F9FAFB` achieves 16.5:1).
- **Large Text (18pt and above):** Minimum contrast ratio of **3.0:1**.
- Always verify contrast when implementing hover states or applying background colors to custom elements.

---

## 📐 2. Spacing Scale & Layout Ratios

Arbitrary, hardcoded pixel margins and paddings lead to jagged, disconnected layouts. You **MUST** use a structured, predictable spacing scale based on design ratios.

### The 8pt / 4pt Geometric Grid
Align all elements to a clean, divisible geometric scale. This ensures clean alignment, consistency, and structural predictability:

| CSS Variable | rem Equivalent | Pixel Equivalent (Base 16px) | Common Use Case |
| :--- | :--- | :--- | :--- |
| `--spacing-xxs` | `0.25rem` | 4px | Small inline gaps, micro-adjustments, icon-to-text spacing |
| `--spacing-xs` | `0.5rem` | 8px | Button padding-y, card inner grid gaps, list item spacing |
| `--spacing-sm` | `0.75rem` | 12px | Badge padding, tight alert layout gaps |
| `--spacing-base` | `1rem` | 16px | Standard body padding, form element gap, inline spacing |
| `--spacing-md` | `1.5rem` | 24px | Button padding-x, card padding, standard grid gap |
| `--spacing-lg` | `2rem` | 32px | Section inner-margins, container gutter spacing |
| `--spacing-xl` | `3rem` | 48px | Large section layouts, header hero padding |
| `--spacing-xxl` | `4rem` | 64px | Epic visual breaks, major footer dividers |

### Vertical Rhythm & Padding Proportions
- **Visual Breathing Room:** When designing custom sections, always ensure the top/bottom container padding is significantly larger than the gap between internal elements (e.g., section padding `var(--spacing-xl)` with internal sibling gaps of `var(--spacing-md)`).
- **Padding Symmetry:** Keep vertical padding symmetric. Card headers should balance perfectly with footers.
- **Form/Button Ratios:** Maintain a 1:2.5 ratio for button padding-y to padding-x (e.g., `0.5rem` top/bottom, `1.25rem` left/right).

---

## 📷 3. Anti-Distortion Image & Media Protocol

One of the most frequent visual issues in AI-generated layouts is image stretching, squishing, or layout shifting (CLS). Follow these rules to protect media presentation:

### The Absolute No-Stretch Directive
Images **MUST NEVER** have their aspect ratio distorted. Avoid writing `width: 100%; height: 200px;` without object management.

### Safe Media Implementation Patterns
1. **Always Preserve Aspect Ratio:**
   ```css
   img {
       max-width: 100%;
       height: auto;
       display: block; /* Eliminate unwanted inline gap */
   }
   ```
2. **Use Object-Fit for Fixed Container Constraints:**
   When an image must fill a specific container height and width, always use `object-fit`:
   ```css
   .featured-thumbnail {
       width: 100%;
       height: 250px;
       object-fit: cover;
       object-position: center;
   }
   ```
3. **Prevent Content Layout Shifts (CLS) with `aspect-ratio`:**
   Instead of forcing fixed heights, let the browser reserve space using modern CSS aspect ratios:
   ```css
   .card-image {
       width: 100%;
       aspect-ratio: 16 / 9;
       object-fit: cover;
   }
   ```

---

## ✍️ 4. Typography Hierarchy & Default Pairings

Clean typography establishes immediate clarity and trust. Keep typography simple, highly legible, and properly proportioned.

### Recommended Obvious Font Pairings
If specific fonts aren't requested or enqueued, use these elegant, highly performant fallback stacks:

*   **Option A: Clean Modern Sans (Default Performance)**
    - **Headings & Body:** System-UI Sans (No network load, ultra-crisp)
    - **Font Stack:** `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
*   **Option B: Editorial Serif & Sans (Sophisticated Tone)**
    - **Headings:** Premium Georgia Stack (Warm, literary)
    - **Body:** Inter or Open Sans (Highly legible at small sizes)
    - **Heading Stack:** `Georgia, "Times New Roman", Times, serif`
    - **Body Stack:** `var(--global-font-family)`

### Typography Scale & Line-Heights
Proportionate line-height is essential for reading comfort:
- **Display titles (H1, Hero):** `line-height: 1.1` to `1.2` (Tight headings look much more unified).
- **Sub-headings (H2, H3, H4):** `line-height: 1.25` to `1.35`.
- **Body copy (Paragraphs, List items):** `line-height: 1.5` to `1.65` (Text is illegible and crowded below 1.45).
- **Captions & Small metadata:** `line-height: 1.4`.

---

## 🚫 5. Anti-AI "Slop" and Aesthetic Restraint Guidelines

AI agents are notorious for over-styling. To avoid the generic "AI template" aesthetic and respect professional web standards, strictly observe the following prohibitions:

### Visual Elements to Avoid
- **🚫 Neon/Rainbow Gradients:** Avoid wrapping text or buttons in intense neon/cyberpunk gradients (e.g., bright purple to hot pink) unless explicitly requested. Prefer solid background colors or extremely subtle monochromatic gradients.
- **🚫 Heavy, Colored Glows:** Never write massive box shadows with high saturation colors (e.g., `box-shadow: 0 0 25px rgba(59, 130, 246, 0.8)`). Shadows should look physical, realistic, and subtle:
  ```css
  /* Good, subtle physical shadow */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  ```
- **🚫 Emoji Overuse:** Emojis are for documentation and developer notes. Do **not** inject decorative emojis into public theme UI elements, buttons, navigation menus, or headings. Keep public interfaces clean, professional, and accessible.
- **🚫 Excessive Rounded Corners:** Avoid rounding every box with extreme border-radius values (e.g., `border-radius: 2rem` or `border-radius: 50%` on rectangular content cards). Maintain visual balance:
  - Standard buttons/inputs: `0.375rem` (6px) or `0.5rem` (8px).
  - Cards and major boxes: `0.5rem` (8px) or `0.75rem` (12px).
  - Fully circular elements (avatars, circle icon buttons): `50%` or `9999px`.
- **🚫 Spinning or Bouncing Animations:** Avoid adding continuous spinning, pulsing, or bouncing animations to elements. Animations must be purposeful (e.g., micro-interactions on hover/focus, loading spinners) and should always respect user system preferences:
  ```css
  @media (prefers-reduced-motion: reduce) {
      * {
          animation-delay: -1ms !important;
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          scroll-behavior: auto !important;
      }
  }
  ```

---

## 🔄 6. Living Document Evolution

This style guide is not static. As you work with the theme developer and get feedback, you **MUST** update this file to reflect the active rules of the project.

### When to update this guide:
1. When the developer approves or defines specific color palette parameters.
2. When custom spacing, fonts, or responsive grid breakpoints are implemented in the project.
3. When new UI components with custom design systems (like sliders, carousel displays, or dark mode) are introduced.

### How to use this guide in your workflow:
- **Planning:** When writing a `SPEC.md` for any layout or styling feature, reference this document and state which tokens or visual conventions you are adhering to.
- **Refactoring:** When organizing temporary styles from `_temp-feature.css` into final CSS partials, verify they map directly to these variables and respect the design patterns defined here.
