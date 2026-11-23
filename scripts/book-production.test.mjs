import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import { bookFromStudioDraft, canApproveBook, listBookSheets, reviseBookScene } from '../src/features/studio/bookProduction.ts';
import { createNourBook, getNourSceneArt } from '../src/features/studio/nourBook.ts';
import { CATALOG_STORIES } from '../src/features/stories/catalogStories.ts';
import { DEFAULT_MERCH_PRODUCTS } from '../src/features/merch/merchCatalog.ts';
import { DEFAULT_SHOWCASE_CONFIG } from '../src/features/showcase/showcaseConfig.ts';

test('Arabic book has a cover and one illustration/text pair per scene', () => {
  const book = createNourBook(true);
  assert.equal(book.language, 'ar');
  assert.equal(book.scenes.length, 6);
  assert.equal(listBookSheets(book).length, 13);
  assert.equal(canApproveBook(book), true);
  assert.deepEqual(listBookSheets(book).slice(0, 3).map(({ kind }) => kind), ['cover', 'art', 'text']);
});

test('a failed scene can be retried independently and revisions require fresh approval', () => {
  const book = createNourBook(true);
  const failed = reviseBookScene(book, 'scene-3', { art: null, status: 'failed' });
  assert.equal(failed.approvedRevision, null);
  assert.equal(canApproveBook(failed), false);
  const restored = reviseBookScene(failed, 'scene-3', { art: getNourSceneArt(2), status: 'ready' });
  assert.strictEqual(restored.scenes[1], book.scenes[1]);
  assert.strictEqual(restored.scenes[3], book.scenes[3]);
  assert.equal(canApproveBook(restored), true);
  assert.equal(restored.approvedRevision, null);
  assert.equal(restored.revision, book.revision + 2);
});

test('legacy drafts sort by page and report absent or illustrative placeholder art', async () => {
  const book = await bookFromStudioDraft({
    key: 'test-draft', storyTitle: 'The lighthouse', childName: 'Avery', storyLang: 'en',
    artStyle: 'Illustration', pageCount: 2, updatedAt: 0,
    pages: [
      { pageNumber: 2, imageUrl: '/stock/placeholder.webp', imagePrompt: '', text: 'Second' },
      { pageNumber: 1, imageUrl: '', imageVaultId: 'test-vault', imagePrompt: '', text: 'First' },
    ],
  }, async (id) => id === 'test-vault' ? '/book/illustration.webp' : null,
  (url) => url.startsWith('/book/'));
  assert.deepEqual(book.scenes.map(({ text, status }) => [text, status]), [['First', 'ready'], ['Second', 'failed']]);
  assert.equal(canApproveBook(book), false);
});

test('all built-in image placements point to shipped refreshed assets', async () => {
  const config = DEFAULT_SHOWCASE_CONFIG;
  const urls = new Set([
    ...CATALOG_STORIES.flatMap((story) => [story.coverImage, ...story.galleryImages, ...story.sampleSpreads.map((page) => page.imageUrl)]),
    ...DEFAULT_MERCH_PRODUCTS.flatMap((product) => [product.coverImage, ...product.galleryImages]),
    ...config.heroBooks.flatMap((slide) => [slide.coverImage, slide.miniPreviewImage]),
    ...config.characterCards.flatMap((card) => [card.primaryImage, ...card.variations.map((variation) => variation.image)]),
    ...config.careerRoles.map((role) => role.image),
    ...createNourBook(true).scenes.map((scene) => scene.art.url),
  ]);
  for (const url of urls) {
    assert.match(url, /^\/artwork\/[a-z0-9-]+\.webp$/);
    assert((await stat(new URL(`../public${url}`, import.meta.url))).size > 0, url);
  }
});
