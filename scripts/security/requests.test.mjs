import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  readJson, requestKey, RequestError, validateStoryRequest, validateEnhanceRequest,
  requireUsableProfile, requireReservation, validateStoryPages,
} from '../../supabase/functions/_shared/requestValidation.ts';
import { validateCharacterPhoto } from '../../src/lib/characterPhoto.ts';

const valid = () => ({
  storyLength: 'short', format: 'storyboard', artStyle: 'watercolor', language: 'ar',
  characters: [{ name: 'نور', role: 'hero' }], interests: ['space'], plotMode: 'auto', customPlot: '',
});
const rejects = (fn, status = 400) => assert.throws(fn, e => e instanceof RequestError && e.status === status);

test('valid story normalizes language codes and strips untrusted extra character fields', () => {
  const input = valid(); input.characters[0].imageUrl = 'private-data';
  const result = validateStoryRequest(input);
  assert.equal(result.language, 'Arabic');
  assert.deepEqual(result.characters, [{ name: 'نور', role: 'hero' }]);
});

test('invalid structures, unsupported options and oversized fields fail before provider use', () => {
  for (const input of [null, [], {}, { ...valid(), language: 'made-up' },
    { ...valid(), storyLength: 'unlimited' }, { ...valid(), characters: [] },
    { ...valid(), characters: Array(7).fill({ name: 'x', role: 'hero' }) },
    { ...valid(), characters: [{ name: 'x'.repeat(81), role: 'hero' }] },
    { ...valid(), characters: [{ name: 'x', role: 'admin' }] },
    { ...valid(), characters: [{ name: 'x', role: 'parent' }] },
    { ...valid(), plotMode: 'manual', customPlot: '' },
    { ...valid(), artStyle: 'custom' }, { ...valid(), interests: 'not-an-array' },
    { ...valid(), interests: Array(11).fill('space') },
    { ...valid(), customPlot: 'x'.repeat(3001) }]) rejects(() => validateStoryRequest(input));
});

test('enhance input has bounded plot and interest fields', () => {
  assert.deepEqual(validateEnhanceRequest({ plot: '  رحلة  ' }), { plot: 'رحلة', interests: [] });
  for (const input of [{ plot: '' }, { plot: 'x'.repeat(3001) }, { plot: 'x', interests: [42] }]) {
    rejects(() => validateEnhanceRequest(input));
  }
});

test('HTTP reader enforces method, media type and valid JSON', async () => {
  const request = (body, headers = { 'content-type': 'application/json' }) => new Request('https://example.invalid', { method: 'POST', headers, body });
  assert.deepEqual(await readJson(request('{"ok":true}')), { ok: true });
  for (const [req, status] of [[new Request('https://example.invalid'), 405],
    [request('{}', { 'content-type': 'text/plain' }), 415], [request('{bad}'), 400],
    [request('{}', { 'content-type': 'application/json', 'content-length': '999999' }), 413],
    [request('"' + 'ع'.repeat(20000) + '"'), 413]]) {
    await assert.rejects(readJson(req), e => e.status === status);
  }
});

test('chunked bodies cannot bypass the byte limit without content-length', async () => {
  let chunks = 0;
  const body = new ReadableStream({ pull(controller) {
    if (chunks++ < 4) controller.enqueue(new Uint8Array(10000)); else controller.close();
  } });
  const req = new Request('https://example.invalid', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half',
  });
  await assert.rejects(readJson(req), e => e.status === 413);
});

test('idempotency key must be a UUID v4', () => {
  const make = key => new Request('https://example.invalid', { headers: { 'x-idempotency-key': key } });
  assert.equal(requestKey(make('8b7c2af0-9892-43e9-870e-f07811424dab')), '8b7c2af0-9892-43e9-870e-f07811424dab');
  rejects(() => requestKey(make('not-a-key')));
  rejects(() => requestKey(new Request('https://example.invalid')));
});

test('missing, banned, invalid and unreadable profiles fail closed', () => {
  requireUsableProfile({ is_banned: false }, null);
  rejects(() => requireUsableProfile(null, null), 503);
  rejects(() => requireUsableProfile({ is_banned: null }, null), 503);
  rejects(() => requireUsableProfile({ is_banned: false }, new Error('unavailable')), 503);
  rejects(() => requireUsableProfile({ is_banned: true }, null), 403);
});

test('only a confirmed quota reservation allows a provider call', () => {
  requireReservation('reserved', null);
  for (const [result, status] of [['disabled', 503], ['duplicate', 409], ['limited', 429], [null, 503], ['unexpected', 503]]) {
    rejects(() => requireReservation(result, null), status);
  }
  rejects(() => requireReservation('reserved', new Error('database unavailable')), 503);
});

test('generated pages must match the requested count, order, content and layouts', () => {
  const page = { pageNumber: 1, sceneDescription: 'scene', dialogueText: 'نص', panelLayoutType: 'single' };
  assert.deepEqual(validateStoryPages([page], 1), [page]);
  rejects(() => validateStoryPages([], 1), 502);
  rejects(() => validateStoryPages([{ ...page, pageNumber: 2 }], 1), 502);
  rejects(() => validateStoryPages([{ ...page, dialogueText: '' }], 1));
  rejects(() => validateStoryPages([{ ...page, panelLayoutType: 'unknown' }], 1));
});

test('photo feedback rejects empty, oversized, spoofed and unsupported files', async () => {
  for (const file of [new File([], 'empty.jpg', { type: 'image/jpeg' }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' }),
    new File(['<svg/>'], 'renamed.jpg', { type: 'image/jpeg' }),
    new File(['GIF89a'], 'photo.gif', { type: 'image/gif' })]) {
    await assert.rejects(validateCharacterPhoto(file));
  }
  await validateCharacterPhoto(new File([Uint8Array.of(255, 216, 255, 224)], 'photo.jpg', { type: 'image/jpeg' }));
  await validateCharacterPhoto(new File([Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)], 'photo.png', { type: 'image/png' }));
});
