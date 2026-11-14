import type { StoryInquiry } from './orderService';
import type { StoryConfig } from '@/features/stories/types';

const key = 'bubbleverse-inquiry-sign-in';

export interface InquiryDraft {
  config: StoryConfig;
  country: StoryInquiry['country'];
  format: StoryInquiry['format'];
  childFirstName: string;
  shippingAddress: string;
  attempts: Record<string, string>;
  ownerId: string | null;
  correctionId?: string;
  expectedUpdatedAt?: string;
}

export function readInquiryDraft(): InquiryDraft | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as InquiryDraft : null;
  } catch {
    return null;
  }
}

export function storeInquiryDraft(draft: InquiryDraft) {
  const { config } = draft;
  sessionStorage.setItem(key, JSON.stringify({
    ...draft,
    config: { ...config, characters: config.characters.map(({ id, name, role }) => ({ id, name, role })) },
  }));
}

export function clearInquiryDraft() {
  try { sessionStorage.removeItem(key); } catch { /* browser storage may be unavailable */ }
}
