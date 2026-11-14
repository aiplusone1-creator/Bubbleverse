import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncSkills } from './sync.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const canonical = resolve(root, '.agents/skills');
const read = path => readFile(resolve(root, path), 'utf8');

async function fixture(t) {
  const path = await mkdtemp(resolve(tmpdir(), 'bubbleverse-skills-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  const source = resolve(path, '.agents/skills/bubbleverse-test/SKILL.md');
  await mkdir(dirname(source), { recursive: true });
  await writeFile(source, 'canonical v1');
  return { path, source, target: resolve(path, '.agent/skills/bubbleverse-test/SKILL.md') };
}

test('all 17 supplied main skills and two helpers are inventoried without publishing original bodies', async () => {
  const source = JSON.parse(await read('docs/skills/SOURCES.json'));
  assert.equal(source.files.length, 19);
  assert.equal(source.files.filter(file => file.kind === 'skill').length, 17);
  assert.equal(source.original_bodies_committed, false);
  assert.ok(source.files.every(file => /^[a-f0-9]{64}$/.test(file.sha256)));
});

test('21 project profiles have valid unique names, scoped descriptions and resolvable project links', async () => {
  const folders = await readdir(canonical);
  assert.equal(folders.length, 21);
  for (const name of folders) {
    const file = resolve(canonical, name, 'SKILL.md');
    const raw = await readFile(file, 'utf8');
    const text = raw.replace(/\r\n/g, '\n');
    assert.ok(text.startsWith('---\nname: ' + name + '\n'));
    assert.ok(/^bubbleverse-[a-z0-9-]+$/.test(name));
    assert.ok(text.includes('CODEX_DIRECTIVES.md'));
    const description = JSON.parse(text.match(/^description: (.+)$/m)[1]);
    assert.ok(description.length > 40 && description.length < 1024);
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      assert.ok(!match[1].startsWith('http'), 'Active skill reference should not require an external missing resource');
      const target = resolve(dirname(file), match[1]);
      assert.ok(!relative(root, target).startsWith('..'));
      assert.ok((await readFile(target, 'utf8')).length > 0);
    }
    const manual = name === 'bubbleverse-prototype' || name === 'bubbleverse-learn-taste';
    assert.equal(text.includes('disable-model-invocation: true'), manual);
    if (manual) assert.match(await readFile(resolve(dirname(file), 'agents/openai.yaml'), 'utf8'), /allow_implicit_invocation: false/);
  }
});

test('export is repeatable, checkable and leaves unrelated local skills untouched', async t => {
  const f = await fixture(t);
  const own = resolve(f.path, '.agent/skills/personal/SKILL.md');
  await mkdir(dirname(own), { recursive: true }); await writeFile(own, 'owner content');
  assert.equal((await syncSkills({ root: f.path })).changed, 1);
  assert.equal((await syncSkills({ root: f.path })).changed, 0);
  assert.equal((await syncSkills({ root: f.path, check: true })).checked, true);
  assert.equal(await readFile(own, 'utf8'), 'owner content');
});

test('source refresh updates only an unchanged managed target', async t => {
  const f = await fixture(t); await syncSkills({ root: f.path });
  await writeFile(f.source, 'canonical v2');
  await assert.rejects(syncSkills({ root: f.path, check: true }), /out of date/);
  assert.equal((await syncSkills({ root: f.path })).changed, 1);
  assert.equal(await readFile(f.target, 'utf8'), 'canonical v2');
});

test('pre-existing unowned files are preserved and conflict fails before any writes', async t => {
  const f = await fixture(t);
  const earlier = resolve(f.path, '.agents/skills/bubbleverse-a/SKILL.md');
  await mkdir(dirname(earlier), { recursive: true }); await writeFile(earlier, 'new source');
  await mkdir(dirname(f.target), { recursive: true }); await writeFile(f.target, 'owner original');
  await assert.rejects(syncSkills({ root: f.path }), /Preserving/);
  assert.equal(await readFile(f.target, 'utf8'), 'owner original');
  await assert.rejects(readFile(resolve(f.path, '.agent/skills/bubbleverse-a/SKILL.md')));
  await assert.rejects(readFile(resolve(f.path, '.agent/skills/.bubbleverse-skill-export.json')));
});

test('locally edited managed files are never silently overwritten', async t => {
  const f = await fixture(t); await syncSkills({ root: f.path }); await writeFile(f.target, 'local edit');
  await assert.rejects(syncSkills({ root: f.path }), /locally edited/);
  assert.equal(await readFile(f.target, 'utf8'), 'local edit');
});

test('escape and canonical destinations are rejected', async t => {
  const f = await fixture(t);
  for (const target of ['../outside', '.', '.git/skills', '.agents/skills', '.GIT/skills', '.AGENTS/skills']) {
    await assert.rejects(syncSkills({ root: f.path, target }));
  }
});

test('symlink target cannot write outside the selected directory', async t => {
  const f = await fixture(t); const outside = await mkdtemp(resolve(tmpdir(), 'bubbleverse-outside-'));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, resolve(f.path, '.agent'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(syncSkills({ root: f.path }), /symlink/);
  assert.deepEqual(await readdir(outside), []);
});
