import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { observeAuth } from '../src/features/auth/authState.ts';
import { createStorySaver } from '../src/features/stories/storyPersistence.ts';
import { toStoryRequest } from '../src/features/stories/types.ts';
import { createTextProvider, createGeminiProvider } from '../supabase/functions/_shared/textProvider.ts';
import { createGenerationHandler } from '../supabase/functions/_shared/generationHandler.ts';
import { generateStory } from '../supabase/functions/_shared/storyGeneration.ts';
import { buildStoryPrompts } from '../supabase/functions/_shared/storyPrompts.ts';
import { RequestError, validateStoryRequest, validateEnhanceRequest } from '../supabase/functions/_shared/requestValidation.ts';

const config = {
  storyLength: 'short', format: 'storyboard', artStyle: 'watercolor', customArtStyle: '',
  language: 'ar', characters: [{ id: 'synthetic', name: 'نور', role: 'hero', imageUrl: 'private-reference' }],
  interests: ['space'], plotMode: 'auto', customPlot: '',
};
const page = n => ({ pageNumber: n, sceneDescription: 'Synthetic scene', dialogueText: 'نص', panelLayoutType: 'single' });
const story = { title: 'Synthetic', pages: [page(1)] };
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

test('story request never sends private photo data or UI character IDs', () => {
  assert.deepEqual(toStoryRequest(config).characters, [{ name: 'نور', role: 'hero' }]);
  assert.equal(config.characters[0].imageUrl, 'private-reference');
});

test('atomic save projects text, excludes photos and shares simultaneous retries', async () => {
  const save = createStorySaver(() => 'key'); const pending = deferred(); const calls = [];
  const repo = { saveStory: (key, payload) => { calls.push({ key, payload }); return pending.promise; } };
  const a = save(repo, 'owner', config, story); const b = save(repo, 'owner', config, story);
  await tick(); assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].payload.config.characters, [{ name: 'نور', role: 'hero' }]);
  assert.equal(calls[0].payload.config.language, 'ar');
  pending.resolve('story-id'); assert.equal(await a, 'story-id'); assert.equal(await b, 'story-id');
  assert.equal(await save(repo, 'owner', config, story), 'story-id'); assert.equal(calls.length, 1);
});
test('lost response retries with the same identity and preserves the original failure', async () => {
  const save = createStorySaver(() => 'stable-key'); const keys = []; let failed = true;
  const repo = { saveStory: async key => { keys.push(key); if (failed) throw new Error('network'); return 'id'; } };
  await assert.rejects(save(repo, 'owner', config, story), { message: 'network' });
  failed = false; assert.equal(await save(repo, 'owner', config, story), 'id');
  assert.deepEqual(keys, ['stable-key', 'stable-key']);
});
test('changed payload, owner or explicit retry key cannot reuse a saved attempt', async () => {
  const save = createStorySaver(() => 'key'); let count = 0;
  const repo = { saveStory: async () => { count++; return 'id'; } };
  await save(repo, 'A', config, story);
  await assert.rejects(save(repo, 'B', config, story));
  await assert.rejects(save(repo, 'A', { ...config, language: 'en' }, story));
  await assert.rejects(save(repo, 'A', config, story, 'other'));
  assert.equal(count, 1);
});
test('empty stories make no request; explicit identity supports rehydrated retries', async () => {
  let count = 0; const repo = { saveStory: async key => { count++; return key; } };
  const save = createStorySaver();
  await assert.rejects(save(repo, 'A', config, { ...story, pages: [] }));
  assert.equal(count, 0);
  assert.equal(await save(repo, 'A', config, structuredClone(story), 'persisted-key'), 'persisted-key');
});
test('save snapshots cannot change when the caller mutates local input', async () => {
  const save = createStorySaver(() => 'key'); const local = structuredClone(config);
  const source = structuredClone(story); let received;
  const pending = save({ saveStory: async (_key, payload) => { received = payload; return 'id'; } }, 'A', local, source);
  local.interests.push('new'); local.characters[0].name = 'changed'; source.pages[0].dialogueText = 'changed';
  await pending;
  assert.deepEqual(received.config.interests, ['space']); assert.equal(received.config.characters[0].name, 'نور');
  assert.equal(received.story.pages[0].dialogueText, 'نص');
});

function authFixture(readRole) {
  const initial = deferred();
  const states = [];
  let listener, unsubscribed = false;
  const stop = observeAuth({
    getSession: () => initial.promise,
    onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; },
  }, readRole, state => states.push(state));
  return { states, initial, stop, emit: session => listener('SIGNED_IN', session), unsubscribed: () => unsubscribed };
}
test('late admin response cannot restore access after logout', async () => {
  const role = deferred(); const f = authFixture(() => role.promise);
  f.emit({ user: { id: 'A' } }); await tick();
  f.emit(null); role.resolve(true); await tick();
  assert.equal(f.states.at(-1).user, null); assert.equal(f.states.at(-1).isAdmin, false); f.stop();
});
test('account switch ignores previous admin lookup and stale initial session', async () => {
  const old = deferred(); const next = deferred();
  const f = authFixture(id => id === 'A' ? old.promise : next.promise);
  f.emit({ user: { id: 'A' } }); await tick();
  f.emit({ user: { id: 'B' } }); await tick();
  old.resolve(true); f.initial.resolve({ data: { session: null }, error: null });
  next.resolve(false); await tick();
  assert.equal(f.states.at(-1).user.id, 'B'); assert.equal(f.states.at(-1).isAdmin, false); f.stop();
});
test('unmount unsubscribes and suppresses late session/role responses', async () => {
  const role = deferred(); const f = authFixture(() => role.promise);
  f.emit({ user: { id: 'A' } }); await tick(); f.stop();
  const count = f.states.length; role.resolve(true); f.initial.resolve({ data: { session: null } }); await tick();
  assert.equal(f.states.length, count); assert.ok(f.unsubscribed());
});
test('role read failure denies admin and leaves loading state', async () => {
  const f = authFixture(async () => { throw new Error('unavailable'); });
  f.initial.resolve({ data: { session: { user: { id: 'A' } } }, error: null }); await tick();
  assert.equal(f.states.at(-1).isAdmin, false); assert.equal(f.states.at(-1).isLoading, false); f.stop();
});

const textRequest = { model: 'synthetic', maxTokens: 100, messages: [{ role: 'user', content: 'Synthetic' }] };

test('gemini provider adapter sends bounded parameters to Google AI Studio endpoint', async () => {
  let calledUrl = '';
  let authHeader = '';
  const provider = createGeminiProvider('gemini-test-key', async (url, options) => {
    calledUrl = url;
    authHeader = options.headers.Authorization;
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'gemini-2.5-flash');
    assert.equal(body.max_tokens, 100);
    assert.ok(options.signal);
    return Response.json({ choices: [{ message: { content: ' Text ' } }] });
  });
  assert.equal(await provider.generateText({ ...textRequest, model: 'google/gemini-2.5-flash' }), 'Text');
  const parsed = new URL(calledUrl);
  assert.equal(parsed.hostname, 'generativelanguage.googleapis.com');
  assert.equal(parsed.pathname, '/v1beta/openai/chat/completions');
  assert.equal(authHeader, 'Bearer gemini-test-key');
  assert.ok(!calledUrl.includes('lovable'));
});

for (const [upstream, expected] of [[402, 402], [403, 402], [429, 429], [500, 502]]) {
  test(`gemini provider HTTP ${upstream} is classified without exposing its body`, async () => {
    const provider = createGeminiProvider('test-only', async () => new Response('private upstream detail', { status: upstream }));
    await assert.rejects(provider.generateText(textRequest), error => error.status === expected && !error.message.includes('private'));
  });
}

test('gemini provider network, invalid JSON and missing content fail safely without retry or fallback', async () => {
  for (const [fetcher, status] of [
    [async () => { throw new Error('private network detail'); }, 503],
    [async () => new Response('{bad}'), 502],
    [async () => Response.json({ choices: [] }), 502],
  ]) {
    let count = 0;
    const provider = createGeminiProvider('test-only', (...args) => { count++; return fetcher(...args); });
    await assert.rejects(provider.generateText(textRequest), error => error.status === status);
    assert.equal(count, 1);
  }
  let called = false;
  await assert.rejects(
    createGeminiProvider(undefined, async () => { called = true; }).generateText(textRequest),
    error => error.status === 503 && error.message === 'Text generation is not configured'
  );
  assert.equal(called, false);
});

test('no request ever reaches a Lovable domain or uses Lovable fallback', async () => {
  const contactedHosts = [];
  const provider = createGeminiProvider('gemini-key', async (url) => {
    contactedHosts.push(new URL(url).hostname);
    return Response.json({ choices: [{ message: { content: 'Story' } }] });
  });
  await provider.generateText(textRequest);
  assert.equal(contactedHosts.length, 1);
  assert.equal(contactedHosts[0], 'generativelanguage.googleapis.com');
  assert.ok(!contactedHosts[0].includes('lovable'));
});

function handlerFixture(failure) {
  const calls = [];
  const handler = createGenerationHandler({
    operation: 'enhance-plot', validate: validateEnhanceRequest,
    authorize: async () => { calls.push('auth'); if (failure === 'auth') throw new RequestError('Denied', 403);
      return { reserve: async () => { calls.push('quota'); if (failure === 'quota') throw new RequestError('Limited', 429); } }; },
    assertProviderConfigured: () => { calls.push('config'); },
    generate: async () => { calls.push('provider'); return { enhancedPlot: 'Synthetic' }; },
  });
  const request = () => new Request('https://example.invalid', { method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer synthetic', 'x-idempotency-key': '8b7c2af0-9892-43e9-870e-f07811424dab' },
    body: JSON.stringify({ plot: 'Synthetic' }),
  });
  return { handler, calls, request };
}
test('shared handler requires authorization and quota before provider work', async () => {
  const f = handlerFixture(); assert.equal((await f.handler(f.request())).status, 200);
  assert.deepEqual(f.calls, ['auth', 'config', 'quota', 'provider']);
  for (const [failure, status] of [['auth', 403], ['quota', 429]]) {
    const f = handlerFixture(failure); assert.equal((await f.handler(f.request())).status, status);
    assert.ok(!f.calls.includes('provider'));
  }
});
test('preflight, method and unauthenticated requests cannot reserve or generate', async () => {
  const f = handlerFixture();
  assert.equal((await f.handler(new Request('https://example.invalid', { method: 'OPTIONS' }))).status, 200);
  assert.equal((await f.handler(new Request('https://example.invalid'))).status, 405);
  const req = f.request(); req.headers.delete('Authorization');
  assert.equal((await f.handler(req)).status, 401); assert.deepEqual(f.calls, []);
});
test('unexpected server errors are sanitized', async t => {
  const silent = mock.method(console, 'error', () => {}); t.after(() => silent.mock.restore());
  const f = createGenerationHandler({ operation: 'enhance-plot', validate: validateEnhanceRequest,
    authorize: async () => { throw new Error('private backend detail'); },
    assertProviderConfigured: () => {}, generate: async () => ({}),
  });
  const r = await f(handlerFixture().request()); assert.equal(r.status, 500);
  assert.ok(!(await r.text()).includes('private backend detail'));
});

test('story prompts cover selected language, custom art, hero and manual/automatic plot', () => {
  const input = validateStoryRequest({ ...config, artStyle: 'custom', customArtStyle: 'Pastel sky', plotMode: 'manual', customPlot: 'Moon picnic' });
  const prompts = buildStoryPrompts(input, 8);
  for (const value of ['Arabic', 'نور', 'Pastel sky', 'Moon picnic']) assert.ok(prompts.user.includes(value));
  const auto = buildStoryPrompts(validateStoryRequest(config), 8);
  assert.ok(auto.user.includes('space')); assert.ok(auto.system.includes('exactly 8'));
});
test('title timeout keeps validated pages and a localized fallback without regenerating', async () => {
  let count = 0;
  const result = await generateStory(validateStoryRequest(config), {
    assertConfigured() {}, generateText: async () => {
      if (++count === 1) return JSON.stringify(Array.from({ length: 8 }, (_, i) => page(i + 1)));
      throw new Error('timeout');
    },
  }, () => 0);
  assert.equal(result.title, 'مغامرتي السحرية'); assert.equal(result.pages.length, 8); assert.equal(count, 2);
});
test('invalid generated story stops before a title request', async () => {
  let count = 0;
  await assert.rejects(generateStory(validateStoryRequest(config), {
    assertConfigured() {}, generateText: async () => { count++; return JSON.stringify([page(1)]); },
  }, () => 0), error => error.status === 502);
  assert.equal(count, 1);
});
