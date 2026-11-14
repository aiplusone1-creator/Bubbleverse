import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { before, after, test } from 'node:test';

// No connection URL/env-file input. Only a newly-created, networkless Docker DB.
const root = fileURLToPath(new URL('../../', import.meta.url));
const container = `bubbleverse-persistence-${randomUUID()}`;
const image = 'postgres:17-alpine@sha256:d3244e8ce3f165ee3c93d9c4a4b1d0fe48b3a89e2287b717fdcbbde92d405065';
const migrationName = '20261114000100_phase1_authorization.sql';
const read = (path) => readFileSync(`${root}${path}`, 'utf8');
const user = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
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
  for (const name of readdirSync(`${root}supabase/migrations`).filter(name => name.endsWith('.sql') && name >= migrationName).sort()) {
    ok(read(`supabase/migrations/${name}`));
  }
});
after(() => {
  if (started) {
    const result = docker(['rm', '-f', container]);
    assert.equal(result.status, 0, 'Disposable database cleanup failed');
  }
});

const payload = () => ({
  config: { storyLength: 'short', format: 'storyboard', artStyle: 'custom', customArtStyle: 'Synthetic watercolor',
    language: 'ar', characters: [{ name: 'Synthetic hero', role: 'hero' }], interests: ['space'],
    plotMode: 'manual', customPlot: 'Synthetic adventure' },
  story: { title: 'Synthetic atomic story', pages: Array.from({ length: 8 }, (_, i) => ({
    pageNumber: i + 1, sceneDescription: 'Synthetic scene', dialogueText: 'Synthetic text', panelLayoutType: 'single',
  })) },
});
const literal = value => "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
const call = (key, body = payload(), owner = user(1)) =>
  `SELECT public.save_generated_story('${owner}', '${key}', ${literal(body)})`;
const commitAs = (source, id = user(1)) =>
  `BEGIN; SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claim.sub" = '${id}'; ${source}; COMMIT;`;
const save = (key = randomUUID(), body = payload(), owner = user(1)) => ok(commitAs(call(key, body, owner), owner));
const total = () => ok(`SELECT (SELECT count(*) FROM public.stories)::text || '/' || (SELECT count(*) FROM public.characters)::text || '/' || (SELECT count(*) FROM public.pages)::text || '/' || (SELECT count(*) FROM public.story_save_requests)::text`);
const orderStory = () => ({
  storyLength: 'short', storyFormat: 'storyboard', artStyle: 'watercolor', customArtStyle: '',
  plotMode: 'auto', customPlot: '', characters: [{ name: 'Synthetic hero', role: 'hero' }], interests: ['space'],
});
const inquiry = (key, name = 'Synthetic child', story = orderStory()) =>
  `SELECT public.submit_story_inquiry('${key}', 'EG', 'digital_pdf', 'ar', '${name}', NULL, ${literal(story)})`;

test('order inquiry retries are owner-scoped and cannot change payment or expose staff data', () => {
  const key = randomUUID();
  const result = JSON.parse(ok(commitAs(inquiry(key))));
  assert.match(result.reference, /^BV-[A-F0-9]{32}$/);
  assert.equal(result.status, 'whatsapp_inquiry');
  assert.equal(JSON.parse(ok(commitAs(inquiry(key)))).id, result.id);
  denied(inquiry(key, 'Different synthetic child'), 'PT409');
  denied(inquiry(key), '42501', user(1), 'anon');
  denied(`SELECT public.get_story_order('${result.id}')`, 'PT404', user(2));
  denied(`UPDATE public.story_orders SET payment_status = 'paid' WHERE id = '${result.id}'`);
  const owner = JSON.parse(ok(asUser(`SELECT public.get_story_order('${result.id}')`)));
  assert.equal(owner.paymentStatus, 'unpaid');
  assert.equal(Object.hasOwn(owner, 'internalNotes'), false);
  denied(`SELECT public.create_story_inquiry('${key}', 'EG', 'digital_pdf', 'ar', 'Synthetic', NULL)`);
  denied(inquiry(randomUUID(), 'Synthetic', { ...orderStory(), photoPath: 'private/test' }), '22023');
  denied(`INSERT INTO public.user_roles(user_id, role) VALUES ('${user(1)}', 'operator')`);
  denied('SELECT * FROM public.b2b_inquiries');
  ok(`DELETE FROM public.story_orders WHERE id = '${result.id}'`);
});

test('concurrent inquiry retries snapshot server pricing and survive a customer correction', async () => {
  const key = randomUUID();
  ok("INSERT INTO public.order_prices VALUES ('EG', 'digital_pdf', 1, 12300, 2000)");
  const results = await Promise.all([1, 2].map(() => sqlAsync(commitAs(inquiry(key)))));
  assert.ok(results.every(result => result.status === 0));
  const orders = results.map(result => JSON.parse(result.stdout));
  const { id } = orders[0];
  assert.equal(orders[1].id, id);
  const resume = `SELECT public.resume_story_inquiry('${id}')`;
  denied(resume, 'PT404', user(2));
  const before = JSON.parse(ok(asUser(resume)));
  assert.equal(before.totalMinor, 12300);
  assert.equal(before.photoUploadEnabled, false);
  assert.equal(before.editable, false);
  const update = (timestamp) => `SELECT public.update_story_inquiry('${id}', '${timestamp}',
    'Corrected synthetic child', NULL, ${literal({ ...orderStory(), interests: ['music'] })})`;
  denied(update(before.updatedAt), 'PT409');
  denied(`SELECT public.request_order_correction('${id}', 'Please correct')`);
  ok(commitAs(`SELECT public.request_order_correction('${id}', 'Please correct')`, user(3)));
  const correction = JSON.parse(ok(asUser(resume)));
  assert.equal(correction.editable, true);
  denied(update(before.updatedAt), 'PT409');
  const changes = await Promise.all([1, 2].map(() => sqlAsync(commitAs(update(correction.updatedAt)))));
  assert.equal(changes.filter(result => result.status === 0).length, 1);
  assert.match(changes.find(result => result.status !== 0).stderr, /PT409/);
  const updated = JSON.parse(changes.find(result => result.status === 0).stdout);
  assert.deepEqual(updated.story.interests, ['music']);
  assert.equal(updated.editable, false);
  assert.equal(JSON.parse(ok(commitAs(inquiry(key)))).id, id);
  denied(inquiry(key, 'Corrected synthetic child'), 'PT409');
  ok(`DELETE FROM public.story_orders WHERE id = '${id}';
     DELETE FROM public.order_prices WHERE country = 'EG' AND format = 'digital_pdf' AND version = 1`);
});

test('order photo bucket denies customer access even with a broad permissive Storage policy', () => {
  ok(`INSERT INTO storage.objects (bucket_id, name) VALUES ('order-child-photos', 'synthetic');
     CREATE POLICY order_photo_test_allow ON storage.objects FOR ALL TO authenticated USING (true) WITH CHECK (true)`);
  assert.equal(ok(asUser("SELECT count(*) FROM storage.objects WHERE bucket_id = 'order-child-photos'")), '0');
  denied("INSERT INTO storage.objects (bucket_id, name) VALUES ('order-child-photos', 'synthetic-write')");
  ok(`DROP POLICY order_photo_test_allow ON storage.objects;
     DELETE FROM storage.objects WHERE bucket_id = 'order-child-photos'`);
});

test('B2B intake is authenticated and keeps submitted contact records private', () => {
  const submit = `SELECT public.submit_b2b_inquiry('Synthetic school', 'Synthetic contact',
    'contact@example.invalid', '+20123456789', 'EG', 'digital_pdf', 'ar', 12, NULL)`;
  denied(submit, '42501', user(1), 'anon');
  const id = ok(commitAs(submit));
  assert.match(id, /^[0-9a-f-]{36}$/);
  denied(`SELECT contact_email FROM public.b2b_inquiries WHERE id = '${id}'`, '42501', user(2));
  assert.equal(ok(`SELECT customer_id FROM public.b2b_inquiries WHERE id = '${id}'`), user(1));
  ok(`DELETE FROM public.b2b_inquiries WHERE id = '${id}'`);
});

test('concurrent order claims have one winner and private detail stays assignment-scoped', async () => {
  const operators = [user(104), user(105)];
  for (const [index, id] of operators.entries()) {
    ok(`INSERT INTO auth.users (id, email) VALUES ('${id}', 'synthetic-operator-${index}@example.invalid');
      INSERT INTO public.user_roles (user_id, role) VALUES ('${id}', 'operator')`);
  }
  const { id } = JSON.parse(ok(commitAs(inquiry(randomUUID()))));
  const claim = `SELECT public.claim_story_order('${id}')`;
  const detail = `SELECT public.get_story_order('${id}')`;
  denied(claim);
  denied(detail, 'PT404', operators[0]);
  const results = await Promise.all(operators.map(operator => sqlAsync(commitAs(claim, operator))));
  assert.equal(results.filter(result => result.status === 0).length, 1);
  const loser = results.findIndex(result => result.status !== 0);
  assert.match(results[loser].stderr, /PT409/);
  denied(detail, 'PT404', operators[loser]);
  const winner = operators[1 - loser];
  assert.equal(JSON.parse(ok(asUser(detail, winner))).assignedOperatorId, winner);
  const assign = `SELECT public.assign_story_order('${id}', '${operators[loser]}')`;
  denied(assign, '42501', winner);
  assert.equal(ok(commitAs(assign, user(3))), id);
  denied(detail, 'PT404', winner);
  ok(`DELETE FROM public.story_orders WHERE id = '${id}'`);
});
function sqlAsync(source) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', container, 'psql', '-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1',
      '-v', 'VERBOSITY=sqlstate', '-h', '127.0.0.1', '-U', 'postgres', '-d', 'bubbleverse_security']);
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; }); child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject); child.on('close', status => resolve({ status, stdout: stdout.trim(), stderr }));
    child.stdin.end(source);
  });
}

test('valid save round-trips config, characters and ordered pages as one completed story', () => {
  const id = save();
  assert.equal(ok(`SELECT status || '/' || language || '/' || art_style FROM public.stories WHERE id = '${id}'`), 'completed/ar/custom');
  assert.deepEqual(JSON.parse(ok(`SELECT config_snapshot FROM public.stories WHERE id = '${id}'`)), payload().config);
  assert.equal(ok(`SELECT count(*) FROM public.pages WHERE story_id = '${id}' AND user_id = '${user(1)}'`), '8');
  assert.equal(ok(`SELECT count(*) FROM public.characters WHERE story_id = '${id}' AND user_id = '${user(1)}' AND original_image_url IS NULL`), '1');
  assert.equal(ok(asUser(`SELECT count(*) FROM public.stories WHERE id = '${id}'`, user(2))), '0');
});
test('owner assertion, anonymous, missing/banned profiles and private ledger access fail closed', () => {
  denied(call(randomUUID(), payload(), user(2)));
  denied(call(randomUUID()), '42501', '', 'anon');
  denied(call(randomUUID(), payload(), user(99)), '42501', user(99));
  // Remove the fixture as maintenance: ordinary users cannot delete profiles via RLS.
  const missing = sql(`BEGIN; DELETE FROM public.profiles WHERE user_id = '${user(1)}';
    SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claim.sub" = '${user(1)}'; ${call(randomUUID())}; ROLLBACK;`);
  assert.notEqual(missing.status, 0); assert.match(missing.stderr, /42501/);
  denied(call(randomUUID()), '42501', user(1), 'service_role');
  ok(`UPDATE public.profiles SET is_banned = true WHERE user_id = '${user(1)}'`);
  denied(call(randomUUID()));
  ok(`UPDATE public.profiles SET is_banned = false WHERE user_id = '${user(1)}'`);
  denied('SELECT * FROM public.story_save_requests');
  denied('SELECT * FROM public.story_save_requests', '42501', '', 'service_role');
});
test('same key and payload returns the same story; changed payload conflicts; owners are isolated', () => {
  const key = randomUUID(); const id = save(key); const before = total();
  assert.equal(save(key), id); assert.equal(total(), before);
  const changed = payload(); changed.story.title = 'Changed'; denied(call(key, changed), 'PT409');
  const other = save(key, payload(), user(2)); assert.notEqual(other, id);
  assert.equal(ok(`SELECT count(*) FROM public.story_save_requests WHERE request_key = '${key}'`), '2');
});
test('invalid shapes, ownership injection, photo data and malformed pages leave no writes', () => {
  const changes = [
    b => { b.user_id = user(2); }, b => { b.config.characters[0].imageUrl = 'data:image/png;base64,synthetic'; },
    b => { b.story.status = 'completed'; }, b => { b.config.language = 'invalid'; },
    b => { b.config.characters = []; }, b => { b.config.characters[0].role = 'friend'; },
    b => { b.config.interests = [null]; }, b => { b.config.customPlot = ''; },
    b => { b.config.customArtStyle = ''; }, b => { b.story.pages = []; },
    b => { b.story.pages[1].pageNumber = 1; }, b => { b.story.pages[0].pageNumber = 1.5; },
    b => { b.story.pages[0].dialogueText = ''; }, b => { b.story.pages[0] = null; },
    b => { b.story.title = 'x'.repeat(256); }, b => { b.config.characters[0].name = 'x'.repeat(81); },
    b => { b.config.interests = Array(11).fill('x'); }, b => { b.story.pages[0].panelLayoutType = 'unknown'; },
  ];
  const before = total();
  for (const change of changes) { const body = payload(); change(body); denied(call(randomUUID(), body), '22023'); }
  for (const body of [null, [], {}, { config: null, story: null }]) denied(call(randomUUID(), body), '22023');
  assert.equal(total(), before);
});
for (const [table, event] of [['characters', 'INSERT'], ['pages', 'INSERT'], ['stories', 'UPDATE'], ['story_save_requests', 'INSERT']]) {
  test(`forced ${table} ${event} failure rolls back all rows and permits a clean retry`, () => {
    const key = randomUUID(); const before = total();
    ok(`CREATE FUNCTION public.test_fail_save() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Synthetic failure'; END $$;
      CREATE TRIGGER test_fail_save BEFORE ${event} ON public.${table} FOR EACH ROW EXECUTE FUNCTION public.test_fail_save()`);
    denied(call(key), 'P0001'); assert.equal(total(), before);
    ok(`DROP TRIGGER test_fail_save ON public.${table}; DROP FUNCTION public.test_fail_save()`);
    const id = save(key); assert.equal(save(key), id);
  });
}
test('simultaneous identical requests commit exactly one story', async () => {
  const key = randomUUID();
  // Hold the first transaction open after saving to force the second through the lock.
  const a = sqlAsync(commitAs(`${call(key)}; SELECT pg_sleep(0.3)`));
  const b = sqlAsync(commitAs(call(key)));
  const results = await Promise.all([a, b]);
  for (const result of results) assert.equal(result.status, 0);
  assert.equal(results[0].stdout, results[1].stdout);
  assert.equal(ok(`SELECT count(*) FROM public.story_save_requests WHERE request_key = '${key}'`), '1');
  assert.equal(ok(`SELECT count(*) FROM public.stories WHERE id = '${results[0].stdout}'`), '1');
});
test('simultaneous conflicting requests have one winner and one conflict', async () => {
  const key = randomUUID(); const changed = payload(); changed.story.title = 'Changed';
  const results = await Promise.all([sqlAsync(commitAs(call(key))), sqlAsync(commitAs(call(key, changed)))]);
  assert.equal(results.filter(r => r.status === 0).length, 1);
  assert.match(results.find(r => r.status !== 0).stderr, /PT409/);
  assert.equal(ok(`SELECT count(*) FROM public.story_save_requests WHERE request_key = '${key}'`), '1');
});
test('hard and soft deletion retain retry tombstones instead of resurrecting stories', () => {
  for (const hard of [true, false]) {
    const key = randomUUID(); const id = save(key);
    ok(hard ? `DELETE FROM public.stories WHERE id = '${id}'` : `UPDATE public.stories SET is_deleted = true WHERE id = '${id}'`);
    const before = total(); denied(call(key), 'PT410'); assert.equal(total(), before);
    if (hard) assert.equal(ok(`SELECT story_id IS NULL FROM public.story_save_requests WHERE request_key = '${key}'`), 't');
  }
});

test('all story lengths accept their page boundaries and reject counts outside them', () => {
  for (const [mode, min, max] of [['short', 8, 10], ['medium', 12, 18], ['epic', 18, 25]]) {
    for (const count of [min, max, min - 1, max + 1]) {
      const body = payload(); body.config.storyLength = mode;
      body.story.pages = Array.from({ length: count }, (_, i) => ({ ...body.story.pages[0], pageNumber: i + 1 }));
      if (count < min || count > max) denied(call(randomUUID(), body), '22023');
      else assert.match(save(randomUUID(), body), /^[0-9a-f-]{36}$/);
    }
  }
});
test('account deletion removes private receipts and owned story rows', () => {
  ok(`INSERT INTO auth.users (id, email) VALUES ('${user(4)}', 'atomic-test@example.invalid')`);
  const id = save(randomUUID(), payload(), user(4));
  ok(`DELETE FROM auth.users WHERE id = '${user(4)}'`);
  assert.equal(ok(`SELECT count(*) FROM public.story_save_requests WHERE user_id = '${user(4)}'`), '0');
  assert.equal(ok(`SELECT count(*) FROM public.stories WHERE id = '${id}'`), '0');
});
