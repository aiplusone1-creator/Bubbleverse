import type { StudioDraftRecord } from '@/lib/localStore';

export interface BookArt {
  url: string;
}

export interface BookScene {
  id: string;
  title: string;
  text: string;
  alt: string;
  art: BookArt | null;
  status: 'pending' | 'ready' | 'failed';
}

export interface StudioBook {
  id: string;
  title: string;
  language: 'ar' | 'en';
  coverTitle?: string;
  childName: string;
  scenes: BookScene[];
  started: boolean;
  revision: number;
  approvedRevision: number | null;
}

export type BookSheet =
  | { kind: 'cover'; scene: BookScene }
  | { kind: 'art' | 'text'; scene: BookScene };

export const MAX_SCENE_TEXT = 500;

export function canApproveBook(book: StudioBook): boolean {
  return book.scenes.length > 0 && book.scenes.every(
    (scene) => scene.status === 'ready' && scene.art && scene.text.trim() &&
      scene.text.length <= MAX_SCENE_TEXT,
  );
}

export function listBookSheets(book: StudioBook): BookSheet[] {
  const first = book.scenes[0];
  if (!first) return [];
  return [
    { kind: 'cover', scene: first },
    ...book.scenes.flatMap((scene): BookSheet[] => [
      { kind: 'art', scene }, { kind: 'text', scene },
    ]),
  ];
}

export function reviseBookScene(book: StudioBook, sceneId: string, patch: Partial<Omit<BookScene, 'id'>>): StudioBook {
  if (!book.scenes.some((scene) => scene.id === sceneId)) return book;
  return {
    ...book,
    revision: book.revision + 1,
    approvedRevision: null,
    scenes: book.scenes.map((scene) => scene.id === sceneId ? { ...scene, ...patch } : scene),
  };
}

export async function bookFromStudioDraft(
  draft: StudioDraftRecord,
  getImage: (id: string) => Promise<string | null>,
  isAssetUrl: (url: string) => boolean,
): Promise<StudioBook> {
  const pages = [...draft.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const scenes = await Promise.all(pages.map(async (page, index): Promise<BookScene> => {
    const original = page.imageVaultId ? await getImage(page.imageVaultId) : null;
    const imageUrl = original ?? page.imageUrl;
    const hasArt = Boolean(imageUrl && isAssetUrl(imageUrl));
    return {
      id: `scene-${index + 1}`,
      title: draft.storyLang === 'ar' ? `المشهد ${index + 1}` : `Scene ${index + 1}`,
      text: page.text,
      alt: '',
      art: hasArt ? { url: imageUrl } : null,
      status: hasArt ? 'ready' : 'failed',
    };
  }));
  return {
    id: `draft:${draft.key}`,
    title: draft.storyTitle,
    language: draft.storyLang,
    childName: draft.childName,
    scenes,
    started: true,
    revision: 0,
    approvedRevision: null,
  };
}
