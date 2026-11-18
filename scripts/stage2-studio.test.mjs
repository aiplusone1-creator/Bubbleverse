import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_PRODUCTION_CHECKLIST,
  DEFAULT_STORY_FALLBACK_IMAGES,
  buildFullStoryArc,
  buildMasterCharacterSheetPrompt,
  buildProductionPromptPackText,
  buildStage2ScenePrompt,
  buildWhatsAppHelperMessages,
  checkImagePrintReadiness,
  countChecklistCompleted,
  createDefaultCharacterDna,
  createDefaultProductionChecklist,
  generateStoryWithConfiguredAi,
  normalizeWhatsAppPhone,
  reformatScenePromptForEngine,
} from '../src/features/studio/stage2PromptEngine.ts';

const sampleBoyDna = createDefaultCharacterDna({
  childName: 'Zain',
  childAge: '5',
  childGender: 'boy',
  hairAndFeatures: 'curly dark hair, warm brown eyes, bright joyful smile',
  signatureOutfit: 'turquoise-and-navy junior astronaut jacket with star patches, blue sneakers',
  artStyle: '3D Pixar Storybook',
  midjourneyCrefUrl: 'https://cdn.bubbleverse.example/sheets/zain-ref.png',
});

const sampleGirlDna = createDefaultCharacterDna({
  childName: 'لينا',
  childAge: '6',
  childGender: 'girl',
  hairAndFeatures: 'wavy chestnut hair with a star clip, bright hazel eyes, warm smile',
  signatureOutfit: 'lavender-and-gold explorer dress with starry cape and pink sneakers',
  artStyle: 'Soft Watercolor Storybook',
  midjourneyCrefUrl: '',
});

test('Master Character Sheet Prompt matches Stage 2 Playbook across Nano Banana, Midjourney, and Flux', () => {
  const nb = buildMasterCharacterSheetPrompt(sampleBoyDna, 'nano_banana');
  assert.match(nb, /Nano Banana \/ Gemini/i);
  assert.match(nb, /1:1/);
  assert.match(nb, /5-year-old boy Zain/);
  assert.match(nb, /soft neutral cream studio background/i);
  assert.match(nb, /\(1\) front facing smiling/i);
  assert.match(nb, /\(2\) 3\/4 view holding a glowing bubble/i);
  assert.match(nb, /\(3\) happy excited expression/i);
  assert.match(nb, /exact facial structure, eye shape, skin tone, smile/i);
  assert.ok(nb.includes(sampleBoyDna.hairAndFeatures));
  assert.ok(nb.includes(sampleBoyDna.signatureOutfit));
  assert.match(nb, /no text, no watermark/i);
  assert.doesNotMatch(nb, /210\s*[x×]\s*210/i);

  const mj = buildMasterCharacterSheetPrompt(sampleBoyDna, 'midjourney');
  assert.match(mj, /Midjourney/i);
  assert.match(mj, /--ar 1:1/);
  assert.match(mj, /--stylize 150/);
  assert.match(mj, /--no text watermark/);
  assert.doesNotMatch(mj, /210\s*[x×]\s*210/i);

  const flux = buildMasterCharacterSheetPrompt(sampleBoyDna, 'flux');
  assert.match(flux, /Flux Kontext \/ PuLID Face Lock/i);
  assert.match(flux, /1:1/);
  assert.match(flux, /no text, no watermark/i);
  assert.doesNotMatch(flux, /210\s*[x×]\s*210/i);
});

test('Stage 2 Scene Prompt enforces 5-block KDP 8.5"x8.5" formula with zero 210x210mm leftovers across all 3 engines', () => {
  const scene = {
    pageNumber: 3,
    totalPages: 24,
    action: 'Floating joyfully next to a friendly glowing purple planet, reaching toward a shimmering cyan soap bubble.',
    environment: 'Dreamy cosmic sky with pastel nebula clouds, golden stardust, soft Pixar volumetric lighting.',
  };

  for (const engine of ['nano_banana', 'midjourney', 'flux']) {
    const prompt = buildStage2ScenePrompt(sampleBoyDna, scene, engine);
    assert.ok(prompt.includes('[CHARACTER LOCK]:'), `${engine} must include [CHARACTER LOCK]`);
    assert.ok(prompt.includes('[ACTION]:'), `${engine} must include [ACTION]`);
    assert.ok(prompt.includes('[ENVIRONMENT & LIGHTING]:'), `${engine} must include [ENVIRONMENT & LIGHTING]`);
    assert.ok(prompt.includes('[COMPOSITION]:'), `${engine} must include [COMPOSITION]`);
    assert.ok(prompt.includes('[NEGATIVE]:'), `${engine} must include [NEGATIVE]`);

    // Exact KDP 8.5"x8.5" safe zone + trim + bottom text card directive
    assert.match(prompt, /center 75% safe zone/i);
    assert.match(prompt, /0\.375"/);
    assert.match(prompt, /8\.5"[×x]8\.5"/);
    assert.match(prompt, /bottom 25% for storybook text card/i);
    assert.match(prompt, /No text, no letters, no speech bubbles, no watermark, no borders, no cropped head, no extra fingers/i);
    assert.doesNotMatch(prompt, /210\s*[x×]\s*210/i, `${engine} must NEVER emit 210x210mm`);
  }

  // Midjourney with explicit cref URL
  const mjWithUrl = buildStage2ScenePrompt(sampleBoyDna, scene, 'midjourney');
  assert.ok(
    mjWithUrl.includes('--cref https://cdn.bubbleverse.example/sheets/zain-ref.png --cw 85 --ar 1:1'),
    'Midjourney prompt must include --cref <url> --cw 85 --ar 1:1'
  );

  // Midjourney without cref URL falls back to [CharacterSheetURL] placeholder
  const mjPlaceholder = buildStage2ScenePrompt(sampleGirlDna, scene, 'midjourney');
  assert.ok(
    mjPlaceholder.includes('--cref [CharacterSheetURL] --cw 85 --ar 1:1'),
    'Midjourney prompt must fall back to [CharacterSheetURL] placeholder when URL is empty'
  );

  // Flux Kontext / PuLID directive and 300 DPI pixel target
  const fluxPrompt = buildStage2ScenePrompt(sampleBoyDna, scene, 'flux');
  assert.match(fluxPrompt, /Flux Kontext \/ PuLID Face Lock reference/);
  assert.match(fluxPrompt, /2588×2625 px 300 DPI/);
});

test('buildFullStoryArc delivers 24 distinct AR and EN story beats with zero text repetition across 10/15/20/24 pages', () => {
  for (const pageCount of [10, 15, 20, 24]) {
    for (const storyLang of ['ar', 'en']) {
      const dna = storyLang === 'ar' ? sampleGirlDna : sampleBoyDna;
      const theme = storyLang === 'ar' ? 'رحلة لينا إلى كوكب الفقاعات' : "Zain's Cosmic Bubble Voyage";
      const pages = buildFullStoryArc(dna, pageCount, storyLang, theme, 'nano_banana');

      assert.equal(pages.length, pageCount, `Expected ${pageCount} pages for ${storyLang}`);

      const uniqueTexts = new Set(pages.map((p) => p.text.trim()));
      const uniqueActions = new Set(pages.map((p) => p.action.trim()));
      const uniquePrompts = new Set(pages.map((p) => p.imagePrompt.trim()));

      assert.equal(uniqueTexts.size, pageCount, `All ${pageCount} ${storyLang} story texts must be unique`);
      assert.equal(uniqueActions.size, pageCount, `All ${pageCount} ${storyLang} visual actions must be unique`);
      assert.equal(uniquePrompts.size, pageCount, `All ${pageCount} ${storyLang} scene prompts must be unique`);

      pages.forEach((p, idx) => {
        assert.equal(p.pageNumber, idx + 1);
        assert.equal(p.suggestedFileName, `${String(idx + 1).padStart(2, '0')}-scene.png`);
        assert.ok(p.text.includes(dna.childName), `Page ${p.pageNumber} must personalize child name`);
        assert.ok(DEFAULT_STORY_FALLBACK_IMAGES.includes(p.imageUrl));
        assert.doesNotMatch(p.imagePrompt, /210\s*[x×]\s*210/i);
      });
    }
  }

  // Arabic gender-aware grammar check (boy vs girl opening beat)
  const arBoy = buildFullStoryArc(sampleBoyDna, 15, 'ar', 'رحلة الفضاء', 'nano_banana');
  const arGirl = buildFullStoryArc(sampleGirlDna, 15, 'ar', 'رحلة الفضاء', 'nano_banana');
  assert.match(arBoy[0].text, /استيقظ البطل/);
  assert.match(arGirl[0].text, /استيقظت البطلة/);
});

test('reformatScenePromptForEngine preserves existing ACTION and ENVIRONMENT when switching engines or DNA', () => {
  const original = buildStage2ScenePrompt(
    sampleBoyDna,
    {
      pageNumber: 7,
      totalPages: 24,
      action: 'Cradling a warm golden floating lantern bubble in both hands.',
      environment: 'Enchanted twilight lantern garden with glowing turquoise fireflies.',
    },
    'nano_banana'
  );

  const switchedToMj = reformatScenePromptForEngine(
    original,
    sampleBoyDna,
    7,
    24,
    'midjourney'
  );
  assert.ok(switchedToMj.includes('Cradling a warm golden floating lantern bubble in both hands.'));
  assert.ok(switchedToMj.includes('Enchanted twilight lantern garden with glowing turquoise fireflies.'));
  assert.ok(switchedToMj.includes('--cref https://cdn.bubbleverse.example/sheets/zain-ref.png --cw 85 --ar 1:1'));

  const switchedToFlux = reformatScenePromptForEngine(
    switchedToMj,
    { ...sampleBoyDna, signatureOutfit: 'emerald-and-gold space explorer suit' },
    7,
    24,
    'flux'
  );
  assert.ok(switchedToFlux.includes('emerald-and-gold space explorer suit'));
  assert.ok(switchedToFlux.includes('Cradling a warm golden floating lantern bubble in both hands.'));
  assert.match(switchedToFlux, /Flux Kontext \/ PuLID Face Lock reference/);
  assert.doesNotMatch(switchedToFlux, /--cref/);
});

test('buildProductionPromptPackText includes header, Master Character Sheet, and numbered scene files', () => {
  const pages = buildFullStoryArc(sampleBoyDna, 15, 'en', 'Cosmic Bubbles', 'midjourney');
  const pack = buildProductionPromptPackText({
    storyTitle: 'Cosmic Bubbles',
    orderReference: 'BV-9942',
    storyLang: 'en',
    dna: sampleBoyDna,
    engine: 'midjourney',
    pages,
  });

  assert.match(pack, /KDP 8\.5" × 8\.5" \(300 DPI\)/);
  assert.ok(pack.includes('Order Reference : BV-9942'));
  assert.ok(pack.includes('STEP 1 — MASTER CHARACTER CONSISTENCY SHEET'));
  assert.ok(pack.includes('STEP 2 — NUMBERED STORY SCENES'));
  assert.ok(pack.includes('### 01-scene.png (Page 1 / 15)'));
  assert.ok(pack.includes('### 15-scene.png (Page 15 / 15)'));
  assert.match(pack, /2588×2625 px @ 300 DPI/);
  assert.match(pack, /8–10% darker/);
  assert.doesNotMatch(pack, /210\s*[x×]\s*210/i);
});

test('checkImagePrintReadiness classifies 300 DPI (>=2500px), upscale recommended (>=1024px), and low_res accurately', () => {
  const kdpBleed = checkImagePrintReadiness(2588, 2625);
  assert.equal(kdpBleed.status, 'print_300dpi');
  assert.equal(kdpBleed.width, 2588);
  assert.equal(kdpBleed.height, 2625);
  assert.match(kdpBleed.labelEn, /300 DPI/i);
  assert.match(kdpBleed.labelAr, /300 DPI/);

  const boundaryReady = checkImagePrintReadiness(2500, 2500);
  assert.equal(boundaryReady.status, 'print_300dpi');

  const asymmetricalUpscale = checkImagePrintReadiness(2600, 2048);
  assert.equal(asymmetricalUpscale.status, 'upscale_recommended');
  assert.match(asymmetricalUpscale.labelEn, /Upscale 2×/i);

  const midRes = checkImagePrintReadiness(1024, 1024);
  assert.equal(midRes.status, 'upscale_recommended');

  const lowRes = checkImagePrintReadiness(800, 800);
  assert.equal(lowRes.status, 'low_res');
  assert.match(lowRes.labelEn, /Low Res/i);

  const invalidRes = checkImagePrintReadiness(Number.NaN, -50);
  assert.equal(invalidRes.status, 'low_res');
  assert.equal(invalidRes.width, 0);
  assert.equal(invalidRes.height, 0);
});

test('WhatsApp helpers normalize EG/SA phones and generate valid wa.me URLs for all 3 fulfillment stages', () => {
  assert.equal(normalizeWhatsAppPhone('01012345678', 'EG'), '201012345678');
  assert.equal(normalizeWhatsAppPhone('+20 101 234 5678', 'EG'), '201012345678');
  assert.equal(normalizeWhatsAppPhone('0501234567', 'SA'), '966501234567');
  assert.equal(normalizeWhatsAppPhone('00966 55 123 4567', 'SA'), '966551234567');
  assert.equal(normalizeWhatsAppPhone('', 'EG'), '');

  const egBundle = buildWhatsAppHelperMessages({
    customerName: 'أحمد محمود',
    childName: 'زين',
    reference: 'BV-2026-101',
    trackingUrl: 'https://bubbleverse.app/track?ref=BV-2026-101',
    phone: '01098765432',
    country: 'EG',
  });

  assert.equal(egBundle.normalizedPhone, '201098765432');
  for (const key of ['requestClearerPhoto', 'sendDraftForApproval', 'confirmPrintingStarted']) {
    const msg = egBundle[key];
    assert.ok(msg.urlAr.startsWith('https://wa.me/201098765432?text='), `${key} AR url must target normalized EG number`);
    assert.ok(msg.urlEn.startsWith('https://wa.me/201098765432?text='), `${key} EN url must target normalized EG number`);
    assert.ok(msg.textAr.includes('زين') && msg.textAr.includes('BV-2026-101'));
    assert.ok(msg.textEn.includes('زين') && msg.textEn.includes('BV-2026-101'));
  }

  // Photo tips present in photo request
  assert.match(egBundle.requestClearerPhoto.textEn, /daylight/i);
  assert.match(egBundle.requestClearerPhoto.textEn, /sunglasses/i);
  assert.match(egBundle.requestClearerPhoto.textAr, /نظارة شمسية/);

  // 8.5"x8.5" and tracking URL present in draft approval and printing started
  assert.match(egBundle.sendDraftForApproval.textEn, /8\.5"×8\.5"/);
  assert.ok(egBundle.sendDraftForApproval.textEn.includes('https://bubbleverse.app/track?ref=BV-2026-101'));
  assert.match(egBundle.confirmPrintingStarted.textEn, /8\.5"×8\.5"/);
  assert.ok(egBundle.confirmPrintingStarted.textAr.includes('https://bubbleverse.app/track?ref=BV-2026-101'));

  // SA greeting differs politely from EG
  const saBundle = buildWhatsAppHelperMessages({
    customerName: 'خالد العتيبي',
    childName: 'لينا',
    reference: 'BV-2026-202',
    trackingUrl: 'https://bubbleverse.app/track?ref=BV-2026-202',
    phone: '0551234567',
    country: 'SA',
  });
  assert.equal(saBundle.normalizedPhone, '966551234567');
  assert.match(saBundle.requestClearerPhoto.textAr, /حياكم الله/);
  assert.ok(saBundle.sendDraftForApproval.urlAr.startsWith('https://wa.me/966551234567?text='));
});

test('Production checklist helpers default to 0/6 and count completed steps accurately', () => {
  const fresh = createDefaultProductionChecklist();
  assert.deepEqual(fresh, DEFAULT_PRODUCTION_CHECKLIST);
  assert.deepEqual(countChecklistCompleted(fresh), { completed: 0, total: 6 });

  const partial = createDefaultProductionChecklist({
    photoApproved: true,
    characterSheetLocked: true,
    artCompleted: true,
  });
  assert.deepEqual(countChecklistCompleted(partial), { completed: 3, total: 6 });
  assert.deepEqual(countChecklistCompleted(undefined), { completed: 0, total: 6 });
});

test('generateStoryWithConfiguredAi falls back safely without leaking keys and wraps valid AI responses in Stage 2 prompts', async () => {
  const secretKey = 'sk-test-super-secret-never-leak-9999';

  // 1. Disabled AI -> local fallback without calling fetch
  let fetchCalled = false;
  const disabledResult = await generateStoryWithConfiguredAi({
    aiConfig: { provider: 'openai', enabled: false, apiKey: secretKey, model: 'gpt-4o-mini' },
    dna: sampleBoyDna,
    storyTitle: 'Star Voyage',
    storyLang: 'en',
    pageCount: 10,
    engine: 'nano_banana',
    fetcher: async () => {
      fetchCalled = true;
      throw new Error('Should not be called');
    },
  });
  assert.equal(fetchCalled, false);
  assert.equal(disabledResult.source, 'local');
  assert.equal(disabledResult.pages.length, 10);
  assert.ok(!disabledResult.notice?.includes(secretKey));

  // 2. HTTP 401 failure -> sanitized error notice (NEVER leaks API key or response body)
  const unauthorizedResult = await generateStoryWithConfiguredAi({
    aiConfig: { provider: 'openai', enabled: true, apiKey: secretKey, model: 'gpt-4o-mini' },
    dna: sampleBoyDna,
    storyTitle: 'Star Voyage',
    storyLang: 'en',
    pageCount: 10,
    engine: 'flux',
    fetcher: async () =>
      new Response(JSON.stringify({ error: `Invalid key ${secretKey}` }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
  });
  assert.equal(unauthorizedResult.source, 'local');
  assert.match(unauthorizedResult.notice ?? '', /401/);
  assert.ok(!(unauthorizedResult.notice ?? '').includes(secretKey), 'Notice must never leak API key');

  // 3. Valid mocked AI response -> merges pages, preserves existing imageUrls, and wraps in Stage 2 prompts
  const aiResult = await generateStoryWithConfiguredAi({
    aiConfig: { provider: 'gemini', enabled: true, apiKey: secretKey, model: 'gemini-2.5-flash' },
    dna: sampleBoyDna,
    storyTitle: 'Star Voyage',
    storyLang: 'en',
    pageCount: 2,
    engine: 'midjourney',
    existingPages: [{ pageNumber: 1, text: 'old', imageUrl: 'data:image/png;base64,PRESERVED' }],
    fetcher: async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify([
                  {
                    pageNumber: 1,
                    text: 'Zain launched his glowing bubble rocket above the clouds.',
                    action: 'Zain cheering inside a sparkling bubble rocket.',
                    environment: 'Pastel starlight atmosphere with glowing turquoise mist.',
                  },
                  {
                    pageNumber: 2,
                    text: 'Zain landed softly beside a smiling moon lantern.',
                    action: 'Zain stepping out onto a glowing lavender crater.',
                    environment: 'Warm twilight moonscape with floating golden bubbles.',
                  },
                ]),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
  });

  assert.equal(aiResult.source, 'ai');
  assert.equal(aiResult.pages.length, 2);
  assert.equal(aiResult.pages[0].text, 'Zain launched his glowing bubble rocket above the clouds.');
  assert.equal(aiResult.pages[0].imageUrl, 'data:image/png;base64,PRESERVED');
  assert.ok(aiResult.pages[0].imagePrompt.includes('[CHARACTER LOCK]:'));
  assert.ok(aiResult.pages[0].imagePrompt.includes('--cref https://cdn.bubbleverse.example/sheets/zain-ref.png --cw 85 --ar 1:1'));
  assert.doesNotMatch(aiResult.pages[0].imagePrompt, /210\s*[x×]\s*210/i);
});
