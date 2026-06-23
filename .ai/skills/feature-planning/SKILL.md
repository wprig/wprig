---
description: Contract-first approach for planning new features in WP Rig themes.
globs: .ai/plans/**/*.md, inc/**/*.php, assets/**/*
---

# Feature Planning: Contract-First Strategy

This skill guides the agent through a "Contract-First" feature planning process for WP Rig. This approach ensures that we have a clear, agreed-upon technical plan before any code is written or files are modified.

## The Core Philosophy

1.  **Contract Establishment:** Do not create or modify theme files until a specification (`SPEC.md`) is finalized and approved by the user. All design-related specs must align with or update the `.ai/STYLE-GUIDE.md`.
2.  **Challenge the Request:** As a WP Rig expert, you must ensure any feature plan follows WP Rig's opinionated architecture and design standards. If a user's request violates these (e.g., inconsistent typography or non-standard markup), you must challenge it.
3.  **Design-Planning Reciprocity:** Designs in the `.ai/STYLE-GUIDE.md` must inform feature planning, and new feature plans that introduce novel design patterns must be used to update the style guide. If this style guide does not yet exist, it must be created and completely documented with a full set of common design patterns and concerns from color pallets to typography, layout spacing rules, and more.
4.  **Strategic Trio Alignment:** Every feature must be evaluated through three lenses:
    - **Architecture:** How does it fit into the PHP/JS structure? (Refer to [Architecture skill](../architecture/SKILL.md))
    - **Web Design:** What are the aesthetic, interactive, and accessibility requirements? Does it adhere to the `.ai/STYLE-GUIDE.md`? (Refer to [Web Designer skill](../web-designer/SKILL.md))
    - **Feature Planning:** How do we define and verify the "Contract"? (Current skill)
5.  **Leverage Registry:** Before planning a new feature, search the [Component Registry](../component-registry/SKILL.md). If a verified component fits the requirements, it **MUST** be used instead of creating a new one to ensure alignment with WP Rig's performance and architectural standards.
6.  **Context Engineering:** Use existing skills (`architecture`, `web-designer`, `php-filters`, `create-component`, `component-registry`, etc.) to inform the plan.

## The Process

### Step 1: Clarification Rounds

Before drafting the specification, ask the user structured questions to define the "What" and the "How".

#### The Clarification Loop
- **One focused question at a time:** Ask exactly one question that targets the highest-impact unknown.
- **Re-scan context:** After each user response, re-scan the codebase and existing skills for additional context if relevant.
- **Self-Confidence Assessment:** After each response, assess your internal confidence level (0-100%) for implementing the feature within WP Rig standards.
- **The 95% Threshold:** Continue the clarification loop until your implementation confidence score is **over 95%**.
- **Challenge the Request:** If the user's requirement doesn't make technical or business sense within WP Rig's architecture, surface your concern immediately.
- **No "Final Question":** Let the conversation flow; do not declare a "final question" until the 95% threshold is met.

#### Echo Check (Contract Proposal)
Once the 95% threshold is reached:
- **Summarize the Contract:** Provide a concise summary of the "Technical Contract" (the "What" and the "How").
- **Declare Confidence:** Explicitly state: "Based on our discussion, I now have a 95% confidence level for the implementation."
- **Seek Agreement:** Ask: "Do you agree with this blueprint, or should we clarify anything else before I draft the formal specification?"

#### Key Areas to Explore
- **Business Value:** What is the core problem being solved? Who is the end-user?
- **WP Rig Integration:**
    - Does this feature exist in the [Component Registry](../component-registry/SKILL.md)? (ALWAYS check `npm run rig:search` first).
    - Does this require a new component? (Refer to [Create Component skill](../create-component/SKILL.md))
    - Will it use existing asset filters? (Refer to [PHP Filters skill](../php-filters/SKILL.md))
    - Does it need new styles, JS, or a design system update? (Refer to [Web Designer skill](../web-designer/SKILL.md), [Styles skill](../styles/SKILL.md), and [npm Scripts skill](../npm-scripts/SKILL.md))
- **Constraints:** Are there specific accessibility or performance requirements? (Refer to [Web Designer skill](../web-designer/SKILL.md))

### Step 2: Draft the Specification

Create a new directory: `.ai/plans/{YYYY-MM-DD}-{feature-slug}/` and create a `SPEC.md` within it.

The `SPEC.md` must include:

1.  **Mission Statement:** A concise goal for the feature.
2.  **Design Compliance:**
    - Reference relevant sections of `.ai/STYLE-GUIDE.md`.
    - Note if this feature will require updates to the style guide.
3.  **Architectural Fit:**
    - Identify the WP Rig components involved. (Refer to [Architecture skill](../architecture/SKILL.md))
    - List the hooks/filters to be used (e.g., `wp_rig_css_files`).
4.  **User Stories:** Simple "As a user, I want..." statements.
5.  **Success Metrics:** How will we verify this? (e.g., "Passes Lighthouse accessibility scan", "No visual regressions in E2E tests").
6.  **Technical Plan (The "Contract"):**
    - **Scaffolding:** Commands like `npm run create-rig-component` or `npm run rig:add [slug]` if using a registry component.
    - **Implementation Steps:** Logical order of file creation/modification.
    - **Verification:** Tools and commands to test the result (Refer to [Testing skill](../testing/SKILL.md)).

### Step 3: Refinement

Present the draft `SPEC.md` to the user and iterate based on their feedback. Only proceed to implementation after the user confirms they are satisfied with the "Contract".

## Best Practices

- **Zero Presumption:** Never assume a specific file path or method name until it's documented in the `SPEC.md`.
- **Reference Skills:** Always link to relevant `/.ai/skills/*.md` files within your technical plan to ensure the agent (or developer) follows the correct recipe.
- **Fail Early:** If the feature request is not technically feasible within WP Rig's architecture, identify this during the planning phase.
- **Maintain Context:** Keep all related planning documents (User Stories, Technical Specs) within the same `.ai/plans/` subdirectory.
