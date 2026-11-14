import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { before, after, test } from 'node:test';

// No connection URL/env-file input. Only a newly-created, networkless Docker DB.
const root = fileURLToPath(new URL('../../', import.meta.url));
const container = `bubbleverse-security-${randomUUID()}`;
const image = 'postgres:17-alpine@sha256:d3244e8ce3f165ee3c93d9c4a4b1d0fe48b3a89e2287b717fdcbbde92d405065';
const migrationName = '20261114000100_phase1_authorization.sql';
const read = (path) => readFileSync(`${root}${path}`, 'utf8');
const migration = read(`supabase/migrations/${migrationName}`);
const user = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const story = (n) => `10000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
let started = false;

function docker(args, input) {
  return spawnSync('docker', args, { input, encoding: 'utf8', timeout: 120000 });
}
function sql(source) {
  return docker(['exec', '-i', container, 'psql', '-X', '-q', '-t', '-A',
    '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=sqlstate',
    '-h', '127.0.0.1', '-U', 'postgres', '-d', 'bubbleverse_security'], source);
}
function ok(source) {
  const result = sql(source);
  // Never echo SQL/fixtures/migration bodies on failure.
  assert.equal(result.status, 0, `SQL failed (SQLSTATE ${result.stderr?.match(/\b[0-9A-Z]{5}\b/)?.[0] ?? 'unavailable'})`);
  return result.stdout.trim();
}
function asUser(source, id = user(1), role = 'authenticated') {
  return `BEGIN; SET LOCAL ROLE ${role}; SET LOCAL "request.jwt.claim.sub" = '${id}'; ${source}; ROLLBACK;`;
}
function denied(source, state = '42501', id = user(1), role = 'authenticated') {
  const result = sql(asUser(source, id, role));
  assert.notEqual(result.status, 0, 'Expected database rejection');
  assert.match(result.stderr, new RegExp(`\\b${state}\\b`), 'Expected SQLSTATE');
}
function countChanges(statement) {
  return `WITH changed AS (${statement} RETURNING 1) SELECT count(*) FROM changed`;
}

before(async () => {
  const result = docker(['run', '-d', '--rm', '--network', 'none',
    '--label', 'bubbleverse.security-test=true',
    '--tmpfs', '/var/lib/postgresql/data',
    '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', '-e', 'POSTGRES_DB=bubbleverse_security',
    '--name', container, image]);
  assert.equal(result.status, 0, 'Cannot start isolated PostgreSQL; ensure Docker and postgres:17-alpine are available');
  started = true;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (docker(['exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'bubbleverse_security']).status === 0) {
      // Require the final TCP server, not the temporary Unix-socket init server.
      if (sql('SELECT 1').status === 0) { ready = true; break; }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Isolated PostgreSQL did not become ready');
  ok(read('supabase/tests/security/bootstrap.sql'));
  for (const name of readdirSync(`${root}supabase/migrations`).filter((name) => name.endsWith('.sql')).sort()) {
    if (name < migrationName) ok(read(`supabase/migrations/${name}`));
  }
  ok(read('supabase/tests/security/fixtures.sql'));
});
after(() => {
  if (started) {
    const result = docker(['rm', '-f', container]);
    assert.equal(result.status, 0, 'Disposable database cleanup failed');
  }
});

test('baseline reproduces privilege-field and foreign-story attachment vulnerabilities', () => {
  assert.equal(ok(asUser(`UPDATE public.profiles SET is_premium = true, is_banned = true WHERE user_id = '${user(1)}'; SELECT is_premium AND is_banned FROM public.profiles WHERE user_id = '${user(1)}'`)), 't');
  assert.equal(ok(asUser(countChanges(`INSERT INTO public.characters (user_id, story_id, name) VALUES ('${user(1)}', '${story(2)}', 'Synthetic')`))), '1');
});

test('migration aborts atomically on legacy ownership inconsistencies', () => {
  ok(`INSERT INTO public.characters (user_id, story_id) VALUES ('${user(1)}', '${story(2)}')`);
  const result = sql(migration);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /P0001/);
  assert.equal(ok("SELECT count(*) FROM pg_trigger WHERE tgname = 'guard_profile_fields'"), '0');
  assert.equal(ok("SELECT count(*) FROM pg_constraint WHERE conname = 'stories_id_owner_unique'"), '0');
  ok(`DELETE FROM public.characters WHERE name IS NULL`);
  ok('INSERT INTO public.stories (title) VALUES (\'Synthetic orphan\')');
  assert.notEqual(sql(migration).status, 0);
  ok("DELETE FROM public.stories WHERE user_id IS NULL");
});

test('authorization migration applies on clean data and validates constraints', () => {
  ok(migration);
  assert.equal(ok(`SELECT count(*) FROM pg_constraint WHERE conname IN ('stories_owner_required', 'characters_owner_required', 'pages_owner_required', 'characters_story_owner_fk', 'pages_story_owner_fk') AND convalidated`), '5');
});

test('ordinary user cannot grant premium, clear ban, or spoof a service-role claim', () => {
  denied(`UPDATE public.profiles SET is_premium = true WHERE user_id = '${user(1)}'`);
  ok(`UPDATE public.profiles SET is_banned = true WHERE user_id = '${user(1)}'`);
  denied(`UPDATE public.profiles SET is_banned = false WHERE user_id = '${user(1)}'`);
  denied(`SET LOCAL "request.jwt.claim.role" = 'service_role'; UPDATE public.profiles SET is_premium = true WHERE user_id = '${user(1)}'`);
  ok(`UPDATE public.profiles SET is_banned = false WHERE user_id = '${user(1)}'`);
});

test('profile INSERT rejects privileged values, including NULL flags', () => {
  for (const flags of ['true, false', 'false, true', 'NULL, false', 'false, NULL']) {
    denied(`DELETE FROM public.profiles WHERE user_id = '${user(1)}'; INSERT INTO public.profiles (user_id, is_premium, is_banned) VALUES ('${user(1)}', ${flags})`);
  }
});

test('parent profile edits and trusted signup remain functional', () => {
  assert.equal(ok(asUser(countChanges(`UPDATE public.profiles SET display_name = 'Synthetic edited', avatar_url = NULL, preferred_currency = 'USD' WHERE user_id = '${user(1)}'`))), '1');
  assert.equal(ok(asUser(`INSERT INTO auth.users (id, email) VALUES ('${user(4)}', 'new-parent@example.invalid'); SELECT count(*) FROM public.profiles WHERE user_id = '${user(4)}'`, user(3), 'postgres')), '1');
});

for (const table of ['stories', 'characters', 'pages']) {
  test(`${table}: cross-user read/update/delete denied; owner read/update/delete works`, () => {
    assert.equal(ok(asUser(`SELECT count(*) FROM public.${table} WHERE user_id = '${user(2)}'`)), '0');
    const field = table === 'stories' ? 'title' : table === 'characters' ? 'name' : 'dialogue_text';
    assert.equal(ok(asUser(countChanges(`UPDATE public.${table} SET ${field} = 'Synthetic changed' WHERE user_id = '${user(2)}'`))), '0');
    assert.equal(ok(asUser(countChanges(`DELETE FROM public.${table} WHERE user_id = '${user(2)}'`))), '0');
    assert.equal(ok(asUser(`SELECT count(*) FROM public.${table} WHERE user_id = '${user(1)}'`)), '1');
    assert.equal(ok(asUser(countChanges(`UPDATE public.${table} SET ${field} = 'Synthetic changed' WHERE user_id = '${user(1)}'`))), '1');
    assert.equal(ok(asUser(countChanges(`DELETE FROM public.${table} WHERE user_id = '${user(1)}'`))), '1');
    assert.equal(ok(asUser(`SELECT count(*) FROM public.${table}`, '', 'anon')), '0');
    denied(`INSERT INTO public.${table} (user_id) VALUES ('${user(1)}')`, '42501', '', 'anon');
  });
}

for (const table of ['characters', 'pages']) {
  test(`${table}: foreign-story insertion/reassignment and ownership spoofing fail`, () => {
    denied(`INSERT INTO public.${table} (story_id, user_id) VALUES ('${story(2)}', '${user(1)}')`);
    denied(`INSERT INTO public.${table} (story_id, user_id) VALUES ('${story(2)}', '${user(2)}')`);
    denied(`UPDATE public.${table} SET story_id = '${story(2)}' WHERE user_id = '${user(1)}'`);
    denied(`UPDATE public.${table} SET story_id = '${story(2)}', user_id = '${user(2)}' WHERE user_id = '${user(1)}'`);
    assert.equal(ok(asUser(countChanges(`INSERT INTO public.${table} (story_id, user_id) VALUES ('${story(1)}', '${user(1)}')`))), '1');
    denied(`INSERT INTO public.${table} (story_id, user_id) VALUES ('${story(2)}', '${user(1)}')`, '23503', user(3), 'service_role');
  });
}

test('ordinary users cannot assign or alter administrative roles', () => {
  denied(`INSERT INTO public.user_roles (user_id, role) VALUES ('${user(1)}', 'admin')`);
  assert.equal(ok(asUser(countChanges(`UPDATE public.user_roles SET role = 'admin' WHERE user_id = '${user(1)}'`))), '0');
  assert.equal(ok(asUser(countChanges(`DELETE FROM public.user_roles WHERE user_id = '${user(3)}'`))), '0');
});

test('administrators retain profile flags, roles and story moderation, without new child access', () => {
  assert.equal(ok(asUser(countChanges(`UPDATE public.profiles SET is_premium = true, is_banned = true WHERE user_id = '${user(2)}'`), user(3))), '1');
  assert.equal(ok(asUser(countChanges(`INSERT INTO public.user_roles (user_id, role) VALUES ('${user(2)}', 'moderator')`), user(3))), '1');
  assert.equal(ok(asUser(`SELECT count(*) FROM public.stories`, user(3))), '2');
  assert.equal(ok(asUser(countChanges(`UPDATE public.stories SET is_deleted = true WHERE user_id = '${user(2)}'`), user(3))), '1');
  assert.equal(ok(asUser(countChanges(`DELETE FROM public.stories WHERE user_id = '${user(2)}'`), user(3))), '1');
  assert.equal(ok(asUser('SELECT count(*) FROM public.characters', user(3))), '0');
});

test('identity/owner transfers are rejected, including admin story transfers', () => {
  denied(`UPDATE public.profiles SET id = gen_random_uuid() WHERE user_id = '${user(1)}'`);
  denied(`UPDATE public.profiles SET created_at = now() WHERE user_id = '${user(1)}'`);
  denied(`UPDATE public.stories SET user_id = '${user(2)}' WHERE user_id = '${user(1)}'`);
  denied(`UPDATE public.stories SET user_id = '${user(2)}' WHERE user_id = '${user(1)}'`, '42501', user(3));
  denied(`UPDATE public.stories SET id = gen_random_uuid() WHERE user_id = '${user(1)}'`);
});

test('storage policies retain private owner access and deny other-user writes/folder moves', () => {
  assert.equal(ok(asUser("SELECT count(*) FROM storage.objects WHERE bucket_id = 'character-images'")), '1');
  assert.equal(ok(asUser("SELECT count(*) FROM storage.objects WHERE bucket_id = 'character-images'", '', 'anon')), '0');
  assert.equal(ok(asUser("SELECT count(*) FROM storage.objects WHERE bucket_id = 'character-images'", user(3))), '2');
  denied(`INSERT INTO storage.objects (bucket_id, name) VALUES ('character-images', '${user(2)}/forbidden.jpg')`);
  denied(`UPDATE storage.objects SET name = '${user(2)}/forbidden.jpg' WHERE name = '${user(1)}/reference.jpg'`);
});

test('story owner deletion still cascades to its own characters and pages', () => {
  assert.equal(ok(asUser(`DELETE FROM public.stories WHERE id = '${story(1)}'; SELECT (SELECT count(*) FROM public.characters) + (SELECT count(*) FROM public.pages)`)), '0');
});

test('owner can create a story and reparent children between its own stories', () => {
  assert.equal(ok(asUser(`INSERT INTO public.stories (id, user_id, title) VALUES ('${story(9)}', '${user(1)}', 'Synthetic own book'); ${countChanges(`UPDATE public.characters SET story_id = '${story(9)}' WHERE user_id = '${user(1)}'`)}`)), '1');
  assert.equal(ok(asUser(`INSERT INTO public.stories (id, user_id) VALUES ('${story(9)}', '${user(1)}'); ${countChanges(`UPDATE public.pages SET story_id = '${story(9)}' WHERE user_id = '${user(1)}'`)}`)), '1');
});

test('parent default profile INSERT and upsert remain safe', () => {
  assert.equal(ok(asUser(`SET LOCAL ROLE postgres; DELETE FROM public.profiles WHERE user_id = '${user(1)}'; SET LOCAL ROLE authenticated; INSERT INTO public.profiles (user_id, display_name) VALUES ('${user(1)}', 'Synthetic'); SELECT NOT is_premium AND NOT is_banned FROM public.profiles WHERE user_id = '${user(1)}'`)), 't');
  denied(`INSERT INTO public.profiles (user_id) VALUES ('${user(1)}') ON CONFLICT (user_id) DO UPDATE SET is_premium = true`);
  assert.equal(ok(asUser(countChanges(`UPDATE public.profiles SET display_name = 'Synthetic' WHERE user_id = '${user(2)}'`))), '0');
});

test('owner cannot spoof another owner on story INSERT; privileged null/orphan writes fail', () => {
  denied(`INSERT INTO public.stories (user_id) VALUES ('${user(2)}')`);
  denied('INSERT INTO public.stories (title) VALUES (\'Synthetic\')', '23514', user(3), 'service_role');
  for (const table of ['characters', 'pages']) {
    denied(`INSERT INTO public.${table} (user_id) VALUES ('${user(1)}')`, '23514', user(3), 'service_role');
  }
});

test('trusted server workflows can still set administrative profile flags', () => {
  assert.equal(ok(asUser(countChanges(`UPDATE public.profiles SET is_premium = true WHERE user_id = '${user(1)}'`), user(3), 'service_role')), '1');
});

test('rollback and reapplication run cleanly without changing records', () => {
  const snapshot = ok("SELECT md5(string_agg(t::text, ',' ORDER BY t::text)) FROM (SELECT to_jsonb(p) AS t FROM public.profiles p UNION ALL SELECT to_jsonb(s) AS t FROM public.stories s UNION ALL SELECT to_jsonb(c) AS t FROM public.characters c UNION ALL SELECT to_jsonb(p) AS t FROM public.pages p) rows");
  ok(read('supabase/tests/security/rollback.sql'));
  assert.equal(ok(asUser(`UPDATE public.profiles SET is_premium = true WHERE user_id = '${user(1)}'; SELECT is_premium FROM public.profiles WHERE user_id = '${user(1)}'`)), 't');
  ok(migration);
  denied(`UPDATE public.profiles SET is_premium = true WHERE user_id = '${user(1)}'`);
  const afterSnapshot = ok("SELECT md5(string_agg(t::text, ',' ORDER BY t::text)) FROM (SELECT to_jsonb(p) AS t FROM public.profiles p UNION ALL SELECT to_jsonb(s) AS t FROM public.stories s UNION ALL SELECT to_jsonb(c) AS t FROM public.characters c UNION ALL SELECT to_jsonb(p) AS t FROM public.pages p) rows");
  assert.equal(afterSnapshot, snapshot);
});
