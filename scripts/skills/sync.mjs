import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url));
const manifestName = '.bubbleverse-skill-export.json';
const hash = value => createHash('sha256').update(value).digest('hex');

async function stat(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function safePath(root, path) {
  const local = relative(root, path);
  if (!local || local === '..' || local.startsWith('..' + sep) || isAbsolute(local)) {
    throw new Error('Export paths must remain below the repository root');
  }
  let current = root;
  for (const part of local.split(sep)) {
    current = resolve(current, part);
    if ((await stat(current))?.isSymbolicLink()) throw new Error('Refusing a symlink export path');
  }
}

async function sourceFiles(base, folder = base) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Refusing symlinks in canonical skills');
    if (entry.isDirectory()) files.push(...await sourceFiles(base, path));
    else if (entry.isFile()) files.push({ name: relative(base, path).split(sep).join('/'), bytes: await readFile(path) });
    else throw new Error('Unexpected canonical skill entry');
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function syncSkills({ root = defaultRoot, target = '.agent/skills', check = false } = {}) {
  root = await realpath(root);
  const source = resolve(root, '.agents/skills');
  const destination = resolve(root, target);
  await safePath(root, destination);
  const local = relative(root, destination).split(sep).map(part => part.toLowerCase());
  if (local.includes('.git') || local[0] === '.agents') throw new Error('Refusing a reserved/canonical export destination');
  if ((await stat(destination)) && !(await stat(destination)).isDirectory()) throw new Error('Export destination must be a directory');
  await safePath(root, source);
  const files = await sourceFiles(source);
  if (!files.length) throw new Error('Canonical skill package is empty');
  if (files.some(file => !file.name.split('/')[0].startsWith('bubbleverse-'))) {
    throw new Error('Only project-scoped bubbleverse profiles may be exported');
  }

  const manifest = resolve(destination, manifestName);
  await safePath(root, manifest);
  let previous = { version: 1, files: {} };
  if (await stat(manifest)) {
    previous = JSON.parse(await readFile(manifest, 'utf8'));
    if (previous.version !== 1 || !previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files)) {
      throw new Error('Unrecognized export manifest; preserve and review it');
    }
  }
  const names = new Set(files.map(file => file.name));
  if (Object.keys(previous.files).some(name => !names.has(name))) {
    throw new Error('Previously managed files were removed from source; review stale exports manually');
  }

  // Preflight every path before any mutation. Unknown/edited files are never overwritten.
  const plan = [];
  for (const file of files) {
    const path = resolve(destination, file.name);
    await safePath(root, path);
    const entry = await stat(path);
    if (entry && !entry.isFile()) throw new Error(`Expected a regular export file: ${file.name}`);
    const current = entry ? hash(await readFile(path)) : null;
    const desired = hash(file.bytes);
    if (current && current !== desired && current !== previous.files[file.name]) {
      throw new Error(`Preserving an unowned or locally edited file: ${file.name}`);
    }
    plan.push({ ...file, path, desired, changed: current !== desired });
  }
  const next = JSON.stringify({ version: 1, files: Object.fromEntries(plan.map(file => [file.name, file.desired])) }, null, 2) + '\n';
  const oldManifest = await stat(manifest) ? await readFile(manifest, 'utf8') : '';
  const changed = plan.filter(file => file.changed);
  if (check) {
    if (changed.length || oldManifest !== next) throw new Error('Skill export is missing or out of date; run skills:sync');
    return { files: plan.length, changed: 0, checked: true };
  }
  for (const file of changed) {
    await mkdir(dirname(file.path), { recursive: true });
    await writeFile(file.path, file.bytes);
  }
  if (oldManifest !== next) {
    await mkdir(destination, { recursive: true });
    await writeFile(manifest, next);
  }
  return { files: plan.length, changed: changed.length, checked: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let target = '.agent/skills';
  let check = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') check = true;
    else if (args[i] === '--target' && args[i + 1]) target = args[++i];
    else throw new Error('Usage: sync.mjs [--check] [--target repo-relative-directory]');
  }
  try { console.log(JSON.stringify(await syncSkills({ target, check }))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
