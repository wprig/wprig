#!/usr/bin/env node
/**
 * Convert WP Rig Base_Support component to strictly block-based (FSE) setup.
 *
 * Features:
 * - Removes classic-only hooks from initialize().
 * - Removes classic-only method implementations.
 * - Removes selected add_theme_support() lines.
 * - Optional: prune HTML5 support block.
 * - Optional: drop title-tag support method and its init hook.
 * - Idempotent: safe to run multiple times.
 * - Dry-run supported via --dry-run.
 * - Creates a .bak backup of the target file on first write.
 *
 * ESM script (package.json has "type":"module"). Node >= 20.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const THEME_ROOT = process.cwd();
const TARGET_REL = 'inc/Base_Support/Component.php';
const TARGET = path.resolve(THEME_ROOT, TARGET_REL);

function parseArgs(argv) {
  const flags = new Set();
  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run' || arg === '--prune-html5' || arg === '--drop-title-tag') {
      flags.add(arg);
    }
  }
  return {
    dryRun: flags.has('--dry-run'),
    pruneHtml5: flags.has('--prune-html5'),
    dropTitleTag: flags.has('--drop-title-tag')
  };
}

function findBalancedRange(source, startIndex, openChar = '(', closeChar = ')') {
  // Return end index AFTER the matching closeChar; or -1 if not found.
  let depth = 0;
  let i = startIndex;
  while (i < source.length) {
    const ch = source[i];
    if (ch === openChar) depth++;
    if (ch === closeChar) {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return -1;
}

function removeInitializeHooks(source, hookMethodNames) {
  const result = { source, removed: [] };

  // Locate initialize() body
  const initFnMatch = /function\s+initialize\s*\(\)\s*\{/m.exec(source);
  if (!initFnMatch) return result; // nothing to do
  const initStartBrace = initFnMatch.index + initFnMatch[0].lastIndexOf('{');

  // Find end of initialize by balancing braces from initStartBrace
  let depth = 1;
  let pos = initStartBrace + 1;
  while (pos < source.length && depth > 0) {
    if (source[pos] === '{') depth++;
    else if (source[pos] === '}') depth--;
    pos++;
  }
  const initEnd = pos; // position after the closing brace

  const before = source.slice(0, initStartBrace + 1);
  const body = source.slice(initStartBrace + 1, initEnd - 1);
  const after = source.slice(initEnd - 1);

  const lines = body.split(/\n/);
  const toRemove = new Set(hookMethodNames);

  const removedNames = new Set();
  const keptLines = [];
  for (const line of lines) {
    let trimmed = line.trim();
    let removed = false;
    // Only target full add_action/add_filter lines that reference array( $this, 'method' )
    for (const name of toRemove) {
      // Accept variations in spacing and quoting
      const re = new RegExp(
        String.raw`^(?:add_action|add_filter)\s*\([^;]*array\s*\(\s*\$this\s*,\s*['\"]${name}['\"]\s*\)[^;]*\);\s*$`
      );
      if (re.test(trimmed)) {
        removed = true;
        removedNames.add(name);
        break;
      }
    }
    if (!removed) keptLines.push(line);
  }

  if (removedNames.size > 0) {
    result.source = before + keptLines.join('\n') + after;
    result.removed = Array.from(removedNames);
  }
  return result;
}

function removeMethodOnce(source, methodName) {
  // Find the function definition by name; include preceding docblock if immediately above
  const fnRegex = new RegExp(
    String.raw`(\/\*\*[^]*?\*\/\s*)?public\s+function\s+${methodName}\s*\([^)]*\)\s*(?::[^\{]*)?\{`,
    'm'
  );
  const match = fnRegex.exec(source);
  if (!match) return { source, removed: false };

  const startIndex = match.index; // start at docblock if present
  // Find body start
  const bodyStart = startIndex + match[0].lastIndexOf('{');
  let depth = 1;
  let i = bodyStart + 1;
  while (i < source.length && depth > 0) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  const endIndex = i; // index after closing brace

  // Remove trailing newline(s)
  let j = endIndex;
  while (j < source.length && (source[j] === '\n' || source[j] === '\r')) j++;

  const newSource = source.slice(0, startIndex) + source.slice(j);
  return { source: newSource, removed: true };
}

function removeMethods(source, methodNames) {
  const removed = [];
  let current = source;
  for (const name of methodNames) {
    const res = removeMethodOnce(current, name);
    if (res.removed) removed.push(name);
    current = res.source;
  }
  return { source: current, removed };
}

function removeThemeSupportLines(source, supportKeys) {
  // Target only inside action_essential_theme_support() to avoid accidental removals
  const fnMatch = /function\s+action_essential_theme_support\s*\(\)\s*\{/m.exec(source);
  if (!fnMatch) return { source, removed: [] };
  const startBrace = fnMatch.index + fnMatch[0].lastIndexOf('{');
  let depth = 1;
  let pos = startBrace + 1;
  while (pos < source.length && depth > 0) {
    if (source[pos] === '{') depth++;
    else if (source[pos] === '}') depth--;
    pos++;
  }
  const endPos = pos; // after closing brace
  const before = source.slice(0, startBrace + 1);
  const body = source.slice(startBrace + 1, endPos - 1);
  const after = source.slice(endPos - 1);

  let removed = [];
  let bodyUpdated = body;
  for (const key of supportKeys) {
    const re = new RegExp(String.raw`^\s*add_theme_support\s*\(\s*['\"]${key}['\"]\s*\)\s*;\s*$`, 'm');
    if (re.test(bodyUpdated)) {
      bodyUpdated = bodyUpdated.replace(re, '');
      removed.push(key);
    }
  }
  if (removed.length === 0) return { source, removed };

  // collapse excess blank lines introduced
  bodyUpdated = bodyUpdated.replace(/\n{3,}/g, '\n\n');
  const updatedSource = before + bodyUpdated + after;
  return { source: updatedSource, removed };
}

function optionallyRemoveHtml5Support(source, enabled) {
  if (!enabled) return { source, removed: false };
  // Find add_theme_support('html5', ...);
  const callStart = source.search(/add_theme_support\s*\(\s*['\"]html5['\"]/m);
  if (callStart === -1) return { source, removed: false };
  const parenOpen = source.indexOf('(', callStart);
  if (parenOpen === -1) return { source, removed: false };
  const parenClose = findBalancedRange(source, parenOpen, '(', ')');
  if (parenClose === -1) return { source, removed: false };
  // Include trailing semicolon and whitespace
  let end = parenClose;
  if (source[end] === ';') end++;
  while (end < source.length && (source[end] === '\n' || source[end] === '\r' || source[end] === ' ' || source[end] === '\t')) end++;
  const before = source.slice(0, callStart);
  const after = source.slice(end);
  return { source: before + after, removed: true };
}

function optionallyDropTitleTagSupport(source, enabled) {
  if (!enabled) return { source, hooksRemoved: [], methodsRemoved: [] };
  let hooksRemoved = [];
  let methodsRemoved = [];
  // Remove hook in initialize()
  const hookRes = removeInitializeHooks(source, ['action_title_tag_support']);
  source = hookRes.source;
  if (hookRes.removed.includes('action_title_tag_support')) hooksRemoved.push('action_title_tag_support');
  // Remove method
  const methRes = removeMethods(source, ['action_title_tag_support']);
  source = methRes.source;
  if (methRes.removed.includes('action_title_tag_support')) methodsRemoved.push('action_title_tag_support');
  return { source, hooksRemoved, methodsRemoved };
}

function validateRemoval(source, methodNames, hookNames) {
  const errors = [];
  for (const name of methodNames) {
    if (new RegExp(String.raw`\b${name}\b`).test(source)) {
      errors.push(`Method name still present: ${name}`);
    }
  }
  // Check initialize() hooks
  const initBodyMatch = /function\s+initialize\s*\(\)\s*\{([\s\S]*?)\}/m.exec(source);
  if (initBodyMatch) {
    const body = initBodyMatch[1];
    for (const name of hookNames) {
      if (new RegExp(String.raw`array\s*\(\s*\$this\s*,\s*['\"]${name}['\"]\s*\)`).test(body)) {
        errors.push(`Hook to ${name} still present in initialize()`);
      }
    }
  }
  return errors;
}

async function main() {
  const { dryRun, pruneHtml5, dropTitleTag } = parseArgs(process.argv);

  const exists = await fs
    .access(TARGET)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    console.error(`File not found: ${TARGET_REL}`);
    process.exitCode = 1;
    return;
  }

  const original = await fs.readFile(TARGET, 'utf8');
  let source = original;

  const report = {
    file: TARGET_REL,
    changed: false,
    backupCreated: false,
    removedHooks: [],
    removedMethods: [],
    removedThemeSupports: [],
    prunedHtml5: false,
    droppedTitleTag: false
  };

  // Remove specific initialize hooks
  const hookTargets = [
    'action_add_pingback_header',
    'filter_body_classes_add_hfeed',
    'filter_embed_dimensions',
    'filter_script_loader_tag'
  ];
  let hookRes = removeInitializeHooks(source, hookTargets);
  source = hookRes.source;
  report.removedHooks.push(...hookRes.removed);

  // Remove methods
  const methodTargets = [
    'action_add_pingback_header',
    'filter_body_classes_add_hfeed',
    'filter_embed_dimensions',
    'filter_script_loader_tag'
  ];
  const methRes = removeMethods(source, methodTargets);
  source = methRes.source;
  report.removedMethods.push(...methRes.removed);

  // Remove theme support lines
  const tsRes = removeThemeSupportLines(source, [
    'automatic-feed-links',
    'customize-selective-refresh-widgets'
  ]);
  source = tsRes.source;
  report.removedThemeSupports.push(...tsRes.removed);

  // Optional: prune html5 support block
  const html5Res = optionallyRemoveHtml5Support(source, pruneHtml5);
  source = html5Res.source;
  if (html5Res.removed) report.prunedHtml5 = true;

  // Optional: drop title-tag support
  const titleRes = optionallyDropTitleTagSupport(source, dropTitleTag);
  source = titleRes.source;
  if (titleRes.hooksRemoved.length || titleRes.methodsRemoved.length) {
    report.droppedTitleTag = true;
    report.removedHooks.push(...titleRes.hooksRemoved);
    report.removedMethods.push(...titleRes.methodsRemoved);
  }

  // Trim any residual blank lines where we removed single lines
  source = source.replace(/\n{3,}/g, '\n\n');

  // Validate intended removals (only the classic four and optionally title-tag)
  const validateMethods = [
    'action_add_pingback_header',
    'filter_body_classes_add_hfeed',
    'filter_embed_dimensions',
    'filter_script_loader_tag',
    ...(dropTitleTag ? ['action_title_tag_support'] : [])
  ].filter((v, i, a) => a.indexOf(v) === i);
  const validateHooks = [
    'action_add_pingback_header',
    'filter_body_classes_add_hfeed',
    'filter_embed_dimensions',
    'filter_script_loader_tag',
    ...(dropTitleTag ? ['action_title_tag_support'] : [])
  ];
  const errors = validateRemoval(source, validateMethods, validateHooks);
  if (errors.length) {
    console.error('Validation failed:', errors.join('; '));
    process.exitCode = 2;
    return;
  }

  report.changed = source !== original;

  if (dryRun) {
    // Print concise report
    printReport(report, true);
    return;
  }

  if (report.changed) {
    // Create backup once
    const backupPath = TARGET + '.bak';
    const backupExists = await fs
      .access(backupPath)
      .then(() => true)
      .catch(() => false);
    if (!backupExists) {
      await fs.writeFile(backupPath, original, 'utf8');
      report.backupCreated = true;
    }
    await fs.writeFile(TARGET, source, 'utf8');
  }

  printReport(report, false);
}

function printReport(rep, dry) {
  const status = rep.changed ? 'changed' : 'unchanged';
  const lines = [];
  lines.push(`${rep.file}: ${status}${dry ? ' (dry-run)' : ''}`);
  if (rep.backupCreated) lines.push('Backup created (.bak)');
  if (rep.removedHooks.length)
    lines.push('Removed hooks: ' + rep.removedHooks.join(', '));
  if (rep.removedMethods.length)
    lines.push('Removed methods: ' + rep.removedMethods.join(', '));
  if (rep.removedThemeSupports.length)
    lines.push('Removed theme supports: ' + rep.removedThemeSupports.join(', '));
  if (rep.prunedHtml5) lines.push('Pruned HTML5 support block');
  if (rep.droppedTitleTag) lines.push('Dropped title-tag support');
  console.log(lines.join('\n'));
}

// Export helpers for unit-like usage if ever imported
export {
  removeInitializeHooks,
  removeMethods,
  removeThemeSupportLines,
  optionallyRemoveHtml5Support,
  optionallyDropTitleTagSupport
};

// Run if executed directly
{
  const invokedHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
  if (invokedHref === import.meta.url) {
    main().catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
  }
}
