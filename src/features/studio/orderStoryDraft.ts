import type { OrderRecord, StudioDraftRecord } from '@/lib/localStore';
import {
  buildFullStoryArc,
  createDefaultCharacterDna,
  createDefaultProductionChecklist,
  detectStoryTheme,
  resolveThemeDna,
  type PromptEngineMode,
} from './stage2PromptEngine';

export function createOrderStoryDraft(
  order: OrderRecord,
  options: { artStyle?: string; engine?: PromptEngineMode } = {},
): StudioDraftRecord | null {
  const item = order.items.find((entry) => entry.itemType !== 'merch');
  if (!item) return null;
  const storyLang = item.storyLanguage === 'en' ? 'en' : 'ar';
  const storyTitle = storyLang === 'ar' ? item.titleAr : item.titleEn;
  const childName = item.childName || (storyLang === 'ar' ? 'البطل' : 'Hero');
  const gender = item.childGender === 'girl' ? 'girl' : 'boy';
  const pageCount = item.pagesCount || 15;
  const engine = options.engine ?? 'nano_banana';
  const theme = detectStoryTheme(
    [item.titleEn, item.titleAr, item.storyId, item.giftMessage, item.occasion, order.orderNotes].filter(Boolean).join(' '),
  );
  const themeDna = resolveThemeDna(theme, gender);
  const characterDna = createDefaultCharacterDna({
    childName,
    childAge: item.childAge || '5',
    childGender: gender,
    ...(options.artStyle ? { artStyle: options.artStyle } : {}),
    storyTheme: theme,
    signatureOutfit: themeDna.signatureOutfit,
    signatureProp: themeDna.signatureProp,
    pose2Description: themeDna.pose2Description,
  });
  const pages = buildFullStoryArc(characterDna, pageCount, storyLang, storyTitle, engine)
    .map(({ pageNumber, text, imagePrompt }) => ({ pageNumber, text, imagePrompt, imageUrl: '' }));

  return {
    key: order.id,
    orderReference: order.reference,
    storyTitle,
    storyLang,
    childName,
    artStyle: characterDna.artStyle,
    pageCount: pages.length,
    pages,
    characterDna,
    promptEngine: engine,
    checklist: createDefaultProductionChecklist({ photoApproved: Boolean(item.photoVaultId) }),
    updatedAt: Date.now(),
  };
}
