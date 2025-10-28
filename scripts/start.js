#!/usr/bin/env node

/**
 * Dynamic start script for WP Rig.
 *
 * Runs the regular dev server. If blocks exist under assets/blocks,
 * it also launches the block builder in watch mode in parallel.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const blocksDir = path.join(rootDir, 'assets', 'blocks');

function hasBlocks() {
  if (!fs.existsSync(blocksDir)) return false;
  try {
    const entries = fs.readdirSync(blocksDir, { withFileTypes: true });
    // Consider a block as a directory (optionally with a src folder).
    const blockDirs = entries.filter((e) => e.isDirectory());
    if (blockDirs.length === 0) return false;

    // Prefer more strict check: has at least one block with a src directory
    const anyWithSrc = blockDirs.some((d) => fs.existsSync(path.join(blocksDir, d.name, 'src')));
    return anyWithSrc || blockDirs.length > 0;
  } catch (_) {
    return false;
  }
}

function spawnProc(command, args, label) {
  const proc = spawn(command, args, { cwd: rootDir, stdio: 'inherit', shell: process.platform === 'win32' });
  proc.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${label}] exited due to signal ${signal}`);
    } else {
      console.log(`[${label}] exited with code ${code}`);
    }
  });
  return proc;
}

function run() {
  const runBlocks = hasBlocks();

  if (runBlocks) {
    console.log('Blocks detected. Starting dev server and block watcher...');
  } else {
    console.log('No blocks detected. Starting dev server only...');
  }

  // Always start the dev server
  const dev = spawnProc('node', ['scripts/cli.js', 'dev'], 'dev');

  let blocks;
  if (runBlocks) {
    blocks = spawnProc('node', ['scripts/build-all-blocks.js', '--watch'], 'blocks');
  }

  function shutdown() {
    // Forward termination to children
    if (blocks && !blocks.killed) {
      try { blocks.kill('SIGTERM'); } catch (_) {}
    }
    if (dev && !dev.killed) {
      try { dev.kill('SIGTERM'); } catch (_) {}
    }
  }

  process.on('SIGINT', () => { shutdown(); process.exit(0); });
  process.on('SIGTERM', () => { shutdown(); process.exit(0); });

  // If any child exits, optionally bring the other down to keep behavior similar to npm-run-all.
  const onExit = () => shutdown();
  dev.on('exit', onExit);
  if (blocks) blocks.on('exit', onExit);
}

run();
